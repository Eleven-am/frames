import { TaskEither, createBadRequestError, createTemporaryRedirectError } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Media, MediaType, Episode } from '@prisma/client';
import { GetIdFromQueryArgs, FinMediaTypes } from '../media/media.contracts';
import { MediaService } from '../media/media.service';
import { RetrieveService } from '../misc/retrieve.service';
import { TmdbService } from '../misc/tmdb.service';
import { PrismaService } from '../prisma/prisma.service';

import { MetaTags } from './render.contracts';


@Injectable()
export class RenderService {
    constructor (
        private readonly tmdb: TmdbService,
        private readonly prisma: PrismaService,
        private readonly mediaService: MediaService,
        private readonly retrieveService: RetrieveService,
    ) {}

    getMovieByName (movieName: string) {
        return this.getMediaByName(movieName, MediaType.MOVIE);
    }

    getShowByName (seriesName: string) {
        return this.getMediaByName(seriesName, MediaType.SHOW);
    }

    getPersonByName (personName: string) {
        const getTmdbId = (personId: string) => TaskEither
            .tryCatch(
                () => this.prisma.credit.findUnique({
                    where: { id: personId },
                }),
                'Error getting person by id',
            )
            .nonNullable('Person not found')
            .map((person) => person.tmdbId);

        const getPerson = (personId: number) => TaskEither
            .tryCatch(
                () => this.tmdb.getPerson(personId),
                'Error getting person by id',
            )
            .map((person): MetaTags => ({
                name: person.name,
                overview: person.biography,
                poster: person.profile_path,
                link: `/p=${person.name.replace(/ /g, '+')}`,
            }));

        return this.getItemByName(personName, FinMediaTypes.PERSON)
            .chain(({ id }) => getTmdbId(id))
            .chain((id) => getPerson(id))
            .orElse(() => this.getDefaults());
    }

    getCollectionByName (collectionName: string) {
        const getCollection = (collectionId: number) => TaskEither
            .tryCatch(
                () => this.tmdb.getCollection(collectionId),
                'Error getting collection by id',
            )
            .map((collection): MetaTags => ({
                name: collection.name,
                overview: collection.overview,
                poster: collection.poster_path,
                link: `/col=${collection.name.replace(/ /g, '+')}`,
            }));

        return this.getItemByName(collectionName, FinMediaTypes.COLLECTION)
            .chain(({ id }) => getCollection(Number(id)))
            .orElse(() => this.getDefaults());
    }

    getCompanyByName (companyName: string) {
        const getCompany = (companyId: string) => TaskEither
            .tryCatch(
                () => this.prisma.company.findUnique({
                    where: { id: companyId },
                }),
                'Error getting company by id',
            )
            .nonNullable('Company not found')
            .map((company) => company.tmdbId);

        const getCompanyFromTmdb = (companyId: number) => TaskEither
            .tryCatch(
                () => this.tmdb.getCompany(companyId),
                'Error getting company by id',
            )
            .map((company): MetaTags => ({
                name: company.name,
                overview: company.description,
                poster: company.logo_path,
                link: `/c=${company.name.replace(/ /g, '+')}`,
            }));

        return this.getItemByName(companyName, FinMediaTypes.COMPANY)
            .chain(({ id }) => getCompany(id))
            .chain((id) => getCompanyFromTmdb(Number(id)))
            .orElse(() => this.getDefaults());
    }

    getRoomById (roomId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.room.findUnique({
                    where: { id: roomId },
                }),
                'Error getting Room by id',
            )
            .nonNullable('Room not found')
            .chain((room) => this.getPlaybackDetailsFromView(room.viewId, `/r=${roomId}`))
    }

    getFrameByCypher (cypher: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.frame.findUnique({
                    where: { cypher },
                }),
                'Error getting frame by cypher',
            )
            .nonNullable('Frame not found')
            .chain((frame) => this.getPlaybackDetailsFromView(frame.viewId, `/f=${cypher}`))
    }

    getPlaybackById (playbackId: string) {
        return this.getPlaybackDetailsFromView(playbackId, `/w=${playbackId}`);
    }

    getPlaylistById (playlistId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.findUnique({
                    where: { id: playlistId },
                    include: {
                        playlistVideos: {
                            orderBy: {
                                index: 'asc',
                            },
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting playlist by id',
            )
            .nonNullable('Playlist not found')
            .filter(
                (playlist) => playlist.playlistVideos.length > 0,
                () => createBadRequestError('Playlist has no videos'),
            )
            .map((playlist) => ({
                overview: playlist.overview ? playlist.overview : `Watch ${playlist.name} on Frames!`,
                poster: playlist.playlistVideos[0].video.media.poster,
                link: `/pl=${playlist.id}`,
                name: playlist.name,
            }))
            .orElse(() => this.getDefaults());
    }

    getDefaults () {
        return TaskEither.of<MetaTags>({
            overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
            name: 'Frames - Watch FREE TV Shows and Movies Online',
            link: '/',
            poster: '/meta.png',
        });
    }

    loadSetup () {
        return this.retrieveService.isConfigured()
            .filter(
                (configured) => !configured,
                () => createTemporaryRedirectError('/'),
            )
            .chain(() => this.getDefaults());
    }

    private getMediaByName (mediaName: string, type: MediaType) {
        const name = mediaName.replace(/\+/g, ' ');

        const convertMedia = (media: Media) => TaskEither
            .tryCatch(
                () => this.tmdb.getMedia(media.tmdbId, media.type),
                'Could not retrieve media',
            )
            .map((tmdbMedia): MetaTags => ({
                name: media.name,
                overview: tmdbMedia.overview || '',
                poster: media.poster,
                link: `/${media.type === MediaType.MOVIE ? 'm' : 's'}=${media.name.replace(/ /g, '-')}`,
            }));

        const getMedia = (id: string) => TaskEither
            .tryCatch(
                () => this.prisma.media.findUnique({
                    where: { id },
                }),
                'Could not find media',
            )
            .nonNullable('Media not found')
            .chain((media) => convertMedia(media));

        return this.mediaService.fuzzySearch(name)
            .map((media) => media.find((m) => m.type === type && m.name.toLowerCase() === name.toLowerCase()))
            .nonNullable('Media not found')
            .chain((media) => getMedia(media.id))
            .orElse(() => this.getDefaults());
    }

    private getItemByName (itemName: string, type: FinMediaTypes) {
        const item = itemName.replace(/\+/g, ' ');
        const args = new GetIdFromQueryArgs();

        args.query = item;
        args.type = type;

        return this.mediaService.getIdFromQuery(args);
    }

    private getPlaybackDetailsFromView(viewId: string, link: string) {
        const getEpisode = (episode: Episode, media: Media) => TaskEither
            .tryCatch(
                () => this.tmdb.getSeason(media.tmdbId, episode.season),
                'Error getting episode by id',
            )
            .map(season => season.episodes)
            .filterItems((item) => item.episode_number === episode.episode)
            .filter(
                (episodes) => episodes.length > 0,
                () => createBadRequestError('Episode not found'),
            )
            .map((episodes) => episodes[0])
            .map((episode) => ({
                name: `${media.name}: S${episode.season_number}, E${episode.episode_number} - ${episode.name}`,
                overview: episode.overview,
                poster: episode.still_path ? `https://image.tmdb.org/t/p/original${episode.still_path}` : media.poster,
            }))

        const getMedia = (media: Media) => TaskEither
            .tryCatch(
                () => this.tmdb.getMedia(media.tmdbId, media.type),
                'Error getting media by id',
            )
            .map((tmdbMedia) => ({
                name: media.name,
                overview: tmdbMedia.overview,
                poster: media.poster
            }))

        return TaskEither
            .tryCatch(
                () => this.prisma.view.findUnique({
                    where: { id: viewId },
                    include: {
                        video: {
                            include: {
                                media: true,
                                episode: true,
                            },
                        },
                    },
                }),
                'Error getting playback by id',
            )
            .nonNullable('Playback not found')
            .matchTask([
                {
                    predicate: (view) => view.video.episode !== null,
                    run: (view) => getEpisode(view.video.episode!, view.video.media)
                },
                {
                    predicate: (view) => view.video.episode === null,
                    run: (view) => getMedia(view.video.media)
                }
            ])
            .map((result): MetaTags => ({
                ...result,
                link,
            }))
            .orElse(() => this.getDefaults());
    }
}
