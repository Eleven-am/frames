import { TaskEither, createBadRequestError } from '@eleven-am/fp';
import { Media, TVShow } from '@eleven-am/tmdbapi';
import { Injectable } from '@nestjs/common';
import { CastType, Company, CompanyType, Media as Show, MediaType } from '@prisma/client';
import { levenshtein } from 'locutus/php/strings';
import path from 'node:path';
import { ScannedImages } from '../images/images.contracts';
import { ImagesService } from '../images/images.service';
import { LanguageService } from '../language/language.service';
import { TmdbService } from '../misc/tmdb.service';
import { FramesFile, RecursiveFramesFile } from '../storage/storage.schema';

import {
    Credit,
    GetImagesSchema,
    ScanPick,
    ScanResult,
    TmdbMediaSchema,
    FramesGuessResult,
    ScanEpisodeResult,
    CreateMediaArgs,
} from './scanner.contracts';


interface MediaParams {
    external_ids: true;
    credits: true;
    images: true;
    videos: true;
}

@Injectable()
export class ScannerIdentifier {
    private static videoExtensions = ['mp4', 'm4v', 'mkv'];

    constructor (
        private readonly tmdbApi: TmdbService,
        private readonly imageApi: ImagesService,
        private readonly languageService: LanguageService,
    ) {}

    public get imagesService () {
        return this.imageApi;
    }

    /**
     * Gets the media from the tmdbId
     * @param tmdbId - the tmdbId to get the media from
     * @param type - the type of media to get
     */
    public getMediaFromTmdbId (tmdbId: number, type: MediaType) {
        return TaskEither
            .tryCatch(
                () => this.tmdbApi.getMedia(
                    tmdbId,
                    type,
                    {
                        language: this.languageService.defaultLanguage.alpha2,
                    },
                ),
                'Error getting media data',
            )
            .map((media): TmdbMediaSchema => ({
                tmdbId: media.id,
                name: 'title' in media ? media.title : media.name,
                year: new Date('release_date' in media ? media.release_date : media.first_air_date).getFullYear(),
            }));
    }

    /**
     * Builds the media from the file
     * @param item - The file to build
     * @param type - The type of media to build
     */
    public buildMedia (item: FramesFile, type: MediaType) {
        return this.getMediaInfo(item, type)
            .chain((result) => this.buildFromTmdbId(result.tmdbId, type, item));
    }

    /**
     * Builds the episodes for a show
     * @param show - the show the episodes belong to
     * @param episodes - the episodes to build
     */
    public buildEpisodes (show: Show, episodes: RecursiveFramesFile[]) {
        return TaskEither
            .tryCatch(
                () => this.tmdbApi.getShow(show.tmdbId, {
                    append_to_response: {
                        external_ids: true,
                        appendSeasons: 'all',
                    },
                }),
                'Error getting show data',
            )
            .chain((tmdbShow) => TaskEither
                .of(episodes)
                .chainItems((item) => this.scanEpisode(tmdbShow, item)));
    }

    /**
   * Gets the images for a media
   * @param query - the query to get the images
   */
    public getMediaImages (query: GetImagesSchema) {
        return TaskEither
            .tryCatch(
                () => this.tmdbApi.getMedia(
                    query.tmdbId,
                    query.type,
                    {
                        append_to_response: {
                            images: true,
                            external_ids: true,
                        },
                    },
                ),
                'Error getting media data',
            )
            .chain((media) => this.imageApi.getFrontImages(media, query.type))
            .map(({ frontImages }) => frontImages);
    }

    /**
   * Builds the media from the tmdbId
   * @param tmdbId - the tmdbId to build from
   * @param type - the type of media to build
   * @param file - the file to build
   */
    public buildFromTmdbId (tmdbId: number, type: MediaType, file: FramesFile) {
        return TaskEither
            .tryCatch(
                () => this.tmdbApi.getMedia(
                    tmdbId,
                    type,
                    {
                        append_to_response: {
                            external_ids: true,
                            credits: true,
                            images: true,
                            videos: true,
                        },
                    },
                ),
                'Error getting media data',
            )
            .chain((media) => this.imageApi.getFrontImages(media, type)
                .chain(({ scannedImages }) => TaskEither
                    .fromNullable(scannedImages)
                    .map((images) => this.retrieveMedia(type, file, images, media))));
    }

    /**
     * Gets the media info from the file
     * @param file - the file to get the media info from
     * @param type - the type of media to get
     */
    public getMediaInfo (file: FramesFile, type: MediaType) {
        return TaskEither
            .fromNullable(this.guessFileInfo(file))
            .chain((mediaInfo) => TaskEither
                .tryCatch(
                    () => this.tmdbApi.searchTmDB(mediaInfo.name, {
                        library_type: type,
                        language: this.languageService.defaultLanguage.alpha2,
                    }),
                )
                .filter(
                    (response) => response.results.length > 0,
                    () => createBadRequestError('No results found'),
                )
                .map((response) => response.results)
                .mapItems((item): ScanPick => ({
                    type,
                    tmdbId: item.id,
                    popularity: item.popularity,
                    name: 'title' in item ? item.title : item.name,
                    drift: levenshtein(mediaInfo.name, 'title' in item ? item.title : item.name),
                    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                    year: new Date('release_date' in item ? item.release_date : item.first_air_date).getFullYear(),
                }))
                .filterItems((item) => item.year !== undefined)
                .filterItems((item) => mediaInfo.year ? (item.year - 1) <= mediaInfo.year && mediaInfo.year <= (item.year + 1) && item.drift < 3 : true))
            .sortBy(['drift', 'popularity'], ['asc', 'desc'])
            .map((items) => items[0])
            .nonNullable('No media found');
    }

    /**
     * Creates a new media ScanResult from the CreateMediaArgs
     * @param params - the params to create the media from
     * @param item - the file to create the media from
     */
    public createNewMedia (params: CreateMediaArgs, item: FramesFile) {
        const manageImage = (url: string | null) => TaskEither
            .fromNullable(url)
            .chain((url) => this.imageApi.getAverageColorFromUrl(url)
                .map((color) => ({
                    url,
                    color,
                })));

        const poster = manageImage(params.poster);
        const backdrop = manageImage(params.backdrop);
        const portrait = manageImage(params.portrait);
        const logo = manageImage(params.logo).orNull();

        const scannedImages = TaskEither
            .fromBind({
                poster,
                backdrop,
                portrait,
                logo,
            })
            .map((images): ScannedImages => ({
                poster: images.poster.url,
                posterAvgColor: images.poster.color,
                backdrop: images.backdrop.url,
                backdropAvgColor: images.backdrop.color,
                portrait: images.portrait.url,
                portraitAvgColor: images.portrait.color,
                logo: images.logo?.url ?? null,
                logoAvgColor: images.logo?.color ?? null,
            }));

        const tmdbDetails = TaskEither
            .tryCatch(
                () => this.tmdbApi.getMedia(
                    params.tmdbId,
                    params.type,
                    {
                        append_to_response: {
                            external_ids: true,
                            credits: true,
                            images: true,
                            videos: true,
                        },
                    },
                ),
                'Error getting media data',
            );

        return TaskEither
            .fromBind({
                scannedImages,
                tmdbDetails,
            })
            .map((data) => this.retrieveMedia(params.type, item, data.scannedImages, data.tmdbDetails));
    }

    private scanEpisode (show: TVShow<{ appendSeasons: 'all', external_ids: true }>, item: RecursiveFramesFile) {
        return TaskEither
            .fromNullable(this.guessFileInfo(item))
            .filter(
                (mediaInfo) => Boolean(mediaInfo.season && mediaInfo.episode) && `Season ${mediaInfo.season}` === item.parentName,
                () => createBadRequestError('Could not guess media info'),
            )
            .map((mediaInfo) => ({
                season: mediaInfo.season!,
                episode: mediaInfo.episode!,
            }))
            .map((matches) => show.appendSeasons.map((season) => season.episodes)
                .flat()
                .find((episode) => episode.season_number === matches.season && episode.episode_number === matches.episode))
            .nonNullable('Episode not found')
            .map((tmdbEpisode): ScanEpisodeResult => ({
                file: item,
                tmdbEpisode,
                imdbId: show.external_ids.imdb_id,
                season: tmdbEpisode.season_number,
                episode: tmdbEpisode.episode_number,
            }));
    }

    private guessFileInfo (file: FramesFile): FramesGuessResult | null {
        const extension = file.name.split('.').pop()
            ?.toLowerCase();

        if ((!extension || !ScannerIdentifier.videoExtensions.includes(extension)) && !file.isFolder) {
            return this.getEpisode(file);
        }

        const regex = /^(?<title>.*?)(?=S\d{2}E\d{2}|\d{3,4}p)/i;
        const match = file.name.match(regex);
        let newName: string;

        if (match && match.groups) {
            newName = match.groups.title;
        } else {
            newName = file.name.replace(/\.[^.]+$/, '').trim();
        }

        const otherDetails = file.name.replace(newName, '');
        let name = this.stripString(newName);
        const details = this.stripString(otherDetails);

        const year = parseInt(name.match(/\d{4}$/)?.[0] || '0', 10);

        name = name.replace(/\d{4}$/, '').trim();
        const seasonEpisode = /s(\d{1,2})e(\d{1,2})|(\d{1,2})x(\d{1,2})|s?(\d{1,2})\s+(\d{1,2})/i;
        const match2 = details.match(seasonEpisode);

        if (match2) {
            const season = parseInt(match2[1] || match2[3] || match2[5], 10);
            const episode = parseInt(match2[2] || match2[4] || match2[6], 10);

            return {
                name,
                year,
                season,
                episode,
            };
        }

        return {
            name,
            year,
            season: null,
            episode: null,
        };
    }

    private getEpisode (file: FramesFile): FramesGuessResult | null {
        const extension = file.name.split('.').pop()
            ?.toLowerCase();

        if ((!extension || !ScannerIdentifier.videoExtensions.includes(extension)) && !file.isFolder) {
            return null;
        }

        const parentName = path.basename(file.path);
        const seasonDir = /Season\s(?<season>\d+)/i;
        const match = parentName.match(seasonDir);

        if (match && match.groups) {
            const season = parseInt(match.groups.season, 10);
            const name = this.stripString(file.name);
            const episode = parseInt(name.match(/\d{1,2}/)?.[0] || '0', 10);

            if (episode > 0) {
                return {
                    name,
                    season,
                    episode,
                    year: new Date().getFullYear(),
                };
            }
        }

        return null;
    }

    private stripString (str: string) {
        const quality = [
            'bluray',
            'webrip',
            'hdtv',
            'remux',
            'dvdrip',
            'brrip',
            'webdl',
            'hddvd',
            'hdrip',
            'dvdscr',
            'web',
            'hd',
            'dvd',
            'tvrip',
            'hdcam',
            'cam',
            'sdtv',
            '1080p',
            '720p',
            '480p',
            '2160p',
            '4k',
            '8k',
            '10bit',
            'x265',
            'x264',
            'h264',
            'h265',
            'h264',
            'h265',
            'aac',
            'ac3',
            'dts',
        ];

        const qualityRegex = new RegExp(`(${quality.join('|')})`, 'gi');

        return str
            .replace(/((?<=\S)\.(?!(?:[A-Z]\.){2,}|\s)(?=\S)|\.$)/g, ' ')
            .replace(/\[.*]/, '')
            .replace(/[()]/g, '')
            .replace(/[^a-zA-Z0-9]+$/g, '')
            .replace(qualityRegex, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private retrieveMedia (type: MediaType, file: FramesFile, scannedImages: ScannedImages, tmdbMedia: Media<MediaType, MediaParams>) {
        const trailer = tmdbMedia.videos.results.find((item) => item.type === 'Trailer')?.key ?? null;
        const released = 'release_date' in tmdbMedia ? tmdbMedia.release_date : tmdbMedia.first_air_date;
        const genres = tmdbMedia.genres.map((item) => item.name.split('&').map((e) => e.trim())).flat();
        const actors = tmdbMedia.credits.cast.map((item) => `${item.name} as ${item.character}`);
        const directorsEmbed = tmdbMedia.credits.crew.filter((item) => item.job === 'Director').map((item) => item.name);
        const tmdbName = 'title' in tmdbMedia ? tmdbMedia.title : tmdbMedia.name;

        const companies: Omit<Company, 'id' | 'created' | 'updated'>[] = tmdbMedia.production_companies?.map((company) => ({
            tmdbId: company.id,
            name: company.name,
            logo: `https://image.tmdb.org/t/p/w500${company.logo_path}`,
            type: CompanyType.PRODUCTION,
        })) ?? [];

        const networks: Omit<Company, 'id' | 'created' | 'updated'>[] = 'networks' in tmdbMedia
            ? tmdbMedia.networks.map((company) => ({
                tmdbId: company.id,
                name: company.name,
                logo: `https://image.tmdb.org/t/p/w500${company.logo_path}`,
                type: CompanyType.DISTRIBUTION,
            }))
            : [];

        const writers: Credit[] = tmdbMedia.credits.crew
            .filter((item) => (/^Writer|Story|Screenplay$/i).test(item.job))
            .map((item) => ({
                name: item.name,
                tmdbId: item.id,
                job: item.job,
                character: null,
                type: CastType.WRITER,
            }));

        const directors: Credit[] = tmdbMedia.credits.crew
            .filter((item) => item.job === 'Director')
            .map((item) => ({
                name: item.name,
                tmdbId: item.id,
                job: item.job,
                character: null,
                type: CastType.DIRECTOR,
            }));

        const producers: Credit[] = tmdbMedia.credits.crew
            .filter((item) => item.job === 'Executive Producer')
            .map((item) => ({
                name: item.name,
                tmdbId: item.id,
                job: item.job,
                character: null,
                type: CastType.PRODUCER,
            }));

        const cast: Credit[] = tmdbMedia.credits.cast
            .map((item) => ({
                name: item.name,
                tmdbId: item.id,
                job: null,
                character: item.character,
                type: CastType.ACTOR,
            }));

        const allCompanies = [...companies, ...networks];
        const credits = [...writers, ...directors, ...producers, ...cast];

        const scanResult: ScanResult = {
            type,
            credits,
            trailer,
            genres,
            actors,
            file,
            name: tmdbName,
            releaseDate: released,
            overview: tmdbMedia.overview,
            directors: directorsEmbed,
            images: scannedImages,
            tmdbId: tmdbMedia.id,
            imdbId: tmdbMedia.external_ids.imdb_id,
            popularity: tmdbMedia.popularity,
            voteAverage: tmdbMedia.vote_average,
            companies: allCompanies,
        };

        return scanResult;
    }
}
