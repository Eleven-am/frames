import {Base} from "./auth";
import {CastCrew, CastType, Episode, Media, MediaType, Role, User, Video, Watched} from "@prisma/client";
import Magnet from "./deluge";
import FileReader, {FileOrFolder, ServiceType} from "./fileReader";
import {tmdbEpisode, tmdbMedia} from "./tmdb";
import Drive from "./drive";
import path from "path";
import rename from "locutus/php/strings/strtr";
import {dicDo} from "./base";

const OS = require('opensubtitles-api');

interface ScanPick {
    name: string;
    tmdbId: number;
    backdrop: string | null;
    drift: number;
    popularity: number;
    year: number;
}

export interface Banner {
    id: number;
    name: string;
    logo: string;
    backdrop: string;
    trailer: string;
    overview: string;
    type: MediaType;
}

export type gridOpt = "list" | "grid";

export interface searchGrid extends GridList {
    diff: number;
}

export type SearchPicker<T> = T extends "list" ? searchGrid[] : T extends "grid" ? searchBlock[] : never;

type GridList = Pick<SpringMedia, 'id' | 'type' | 'name'>;

export interface searchBlock extends Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'> {
    diff: number;
}

interface Med extends Omit<Media, "id" | "created" | "updated" | "production" | "collection"> {
    production: { id: string, name: string }[];
    collection?: { id: number, name: string, poster: string | null };
}

export interface SpringEpisode extends Omit<Episode, "created" | "updated" | "showId" | "videoId" | "seasonId"> {
    season: number;
    episode: number;
    name: string;
    position?: number;
    overview: string | null;
    backdrop: string | null;
    type: 'EPISODE' | 'SEASON';
    show: {
        id: number; name: string; poster: string; backdrop: string; logo: string | null; background: string; overview: string; type: MediaType;
    };
}

export interface SpringMedia extends Omit<Media, "created" | "updated" | "production" | "collection" | "release"> {
    sections: string[];
    directors: Omit<CastCrew, 'tmdbId' | 'mediaId'>[];
    writers: Omit<CastCrew, 'tmdbId' | 'mediaId'>[];
    cast: Omit<CastCrew, 'tmdbId' | 'mediaId'>[];
    producers: Omit<CastCrew, 'tmdbId' | 'mediaId'>[];
    release: string;
    production: { id: string, name: string }[];
    collection?: { id: number, name: string, poster: string } | null;
    seasons: SpringEpisode[];
    recommendations: {
        id: number; name: string; poster: string; background: string; type: MediaType;
    }[];
}

export type MedForMod = Pick<SpringMedia, 'name' | 'poster' | 'backdrop' | 'logo' | 'type' | 'tmdbId'> & {
    file?: FileOrFolder; mediaId: number; year: number; stateType: 'MODIFY' | 'ADD' | 'NONE'; suggestions: { name: string, tmdbId: number, year: number }[];
}

export interface EpisodeModSettings {
    showId: number;
    seasonId: number;
    episodeId: number;
    episode: number;
    file?: FileOrFolder
}

export interface FrameEpisodeScan {
    name: string | null;
    overview: string | null;
    backdrop: string | null;
    seasonId: number;
    episode: number;
    showId: number;
    location: string;
}

export interface FrontEpisode {
    showId: number;
    tmdbId: number;
    seasons: {
        seasonId: number; episodes: (EpisodeModSettings & { backdrop: string, name: string, overview: string, found: boolean })[];
    }[]
}

export interface FrontMediaSearch {
    drift: number;
    name: string;
    tmdbId: number;
    year: number;
    inLibrary: boolean;
    libraryName: string | null;
    libraryLocation: string | null;
}

export interface UpNext {
    name: string;
    mediaId: number;
    videoId: number;
    overview: string;
    location: string;
    episodeId?: number;
    logo: string | null;
    playlistId?: number;
    backdrop: string;
    episodeName?: string;
    episodeBackdrop?: string;
    type: MediaType | 'PLAYLIST';
}

export interface BrowseData {
    trending: Banner[];
    genres: string[];
    decades: string[];
}

export default class MediaClass extends Base {
    protected readonly moviesLocation: string;
    protected readonly showsLocation: string;
    protected readonly deluge: Magnet;
    protected readonly drive: FileReader;
    protected readonly OpenSubtitles;

    constructor(serviceType?: ServiceType) {
        super();
        this.deluge = new Magnet();
        this.moviesLocation = this.regrouped.user?.library?.movies ?? '';
        this.showsLocation = this.regrouped.user?.library?.tvShows ?? '';
        if (this.regrouped.openSubtitles) {
            const {useragent, password, username} = this.regrouped.openSubtitles;
            this.OpenSubtitles = new OS({useragent, username, password, ssl: true});
        }

        switch (serviceType) {
            case ServiceType.GOOGLE_DRIVE:
                this.drive = new Drive();
                break;
            default:
                this.drive = new Drive();
        }
    }

    /**
     * @desc gets the episode details for a specific episode of a series
     * @param episodeId - the id of the episode
     */
    public async getEpisode(episodeId: number): Promise<SpringEpisode | null> {
        let result = await this.prisma.episode.findUnique({
            where: {id: episodeId}, include: {media: true},
        });

        if (result) {
            if (!result.backdrop && result.updated.getTime() < (Date.now() - (1000 * 60 * 60 * 7))) {
                let episodeInfo = await this.tmdb?.getEpisode(result.media.tmdbId, result.seasonId, result.episode);
                const backdrop = episodeInfo?.still_path ? "https://image.tmdb.org/t/p/original" + episodeInfo.still_path : result.media.backdrop;
                if (episodeInfo && episodeInfo.still_path) await this.prisma.episode.update({
                    where: {id: result.id}, data: {
                        backdrop, name: episodeInfo.name, overview: episodeInfo.overview
                    }
                });

                result = {
                    ...result,
                    backdrop,
                    name: episodeInfo?.name || result.name,
                    overview: episodeInfo?.overview || result.overview
                }
            }

            const name = /^Episode \d+/i.test(result?.name || 'Episode') ? `${result.media.name}: S${result.seasonId}, E${result.episode}` : `S${result.seasonId}, E${result.episode}: ${result?.name}`;
            return {
                type: 'EPISODE',
                episode: result.episode,
                name,
                season: result.seasonId,
                id: result.id,
                backdrop: result.backdrop,
                overview: result.overview,
                show: {
                    id: result.media.id,
                    name: result.media.name,
                    poster: result.media.poster,
                    backdrop: result.media.backdrop,
                    overview: result.media.overview,
                    logo: result.media.logo,
                    background: result.media.background,
                    type: result.media.type
                }
            }

        }
        return null;
    }

    /**
     * @desc Finds new episodes and seasons for a show in the database
     * @param id - the id of the show
     */
    public async getMissingEpisodesInShow(id: number) {
        const media = await this.prisma.media.findUnique({
            where: {id}, include: {episodes: true}
        });
        if (media && media.type === MediaType.SHOW) {
            const episodes = this.sortArray(media.episodes, ['seasonId', 'episode'], ['asc', 'asc']);
            const distinctSeasons = this.uniqueId(episodes, ['seasonId']);
            const tmdbSeasons = await this.tmdb?.getAllEpisodes(media.tmdbId) || {episodes: [], tmdbId: media.tmdbId};

            const missingSeason = tmdbSeasons.episodes.filter(e => distinctSeasons.every(s => s.seasonId !== e.seasonId));
            const tmdbEpisodes = tmdbSeasons.episodes.map(e => e.season.flat()).flat();
            const missingEpisodes = tmdbEpisodes.filter(e => missingSeason.every(s => s.seasonId !== e.season_number))
                .filter(e => !episodes.find(ep => ep.seasonId === e.season_number && ep.episode === e.episode_number))
                .filter(e => Date.now() > new Date(e.air_date).getTime());

            let promises = missingSeason.map(e => this.deluge.addSeasonTorrent(media.tmdbId, e.seasonId))
                .concat(missingEpisodes.map(e => this.deluge.addSeasonTorrent(media.tmdbId, e.season_number, e.episode_number)));

            const data = await Promise.all(promises);
            await this.deluge.addTorrents(data);
        }
    }

    /**
     * @desc Finds new episodes and seasons for shows in the database
     */
    public async getMissingEpisodes() {
        const shows = await this.prisma.media.findMany({
            where: {type: MediaType.SHOW}, orderBy: {updated: 'desc'}
        });

        for await (const e of shows)
            await this.getMissingEpisodesInShow(e.id)
    }

    /**
     * @desc gets the list of all episodes for a media in the database
     * @param mediaId - the id of the media
     * @param userId - the user requesting the episodes
     */
    public async getEpisodes(mediaId: number, userId: string) {
        const media = await this.prisma.media.findUnique({
            where: {id: mediaId}, include: {episodes: {include: {video: true}}, folder: true}
        });
        if (media && media.folder) {
            const seasons = this.uniqueId(media.episodes, 'seasonId');
            const show: FrontEpisode = {
                showId: media.id, tmdbId: media.tmdbId, seasons: [],
            }
            const files = await this.drive?.recursiveReadFolder(media.folder.location) || [];
            const episodes: EpisodeModSettings[] = media.episodes.map(e => {
                const file = files.find(f => f.location === e.video.location);
                return {file, episodeId: e.id, seasonId: e.seasonId, showId: media.id, episode: e.episode};
            });

            for await (const season of seasons) {
                const tmdbSeason = await this.tmdb?.getSeason(media.tmdbId, season.seasonId);
                if (tmdbSeason) {
                    const episodesInSeason = episodes.filter(e => e.seasonId === season.seasonId);
                    const data = {
                        seasonId: season.seasonId, episodes: episodesInSeason.map(e => {
                            const tmdbEpisode = tmdbSeason.episodes.find(ep => ep.episode_number === e.episode);
                            const backdrop = tmdbEpisode?.still_path ? `https://image.tmdb.org/t/p/original${tmdbEpisode.still_path}` : media.backdrop;
                            const name = tmdbEpisode?.name ? `S${e.seasonId}: E${e.episode}: ` + tmdbEpisode.name : media.name + `, S${e.seasonId}: E${e.episode}`;
                            const overview = tmdbEpisode?.overview || media.overview;
                            return {...e, backdrop, name, overview, found: !!tmdbEpisode};
                        })
                    };

                    show.seasons.push(data);

                } else show.seasons.push({
                    seasonId: season.seasonId, episodes: episodes.filter(e => e.seasonId === season.seasonId).map(e => {
                        const backdrop = media.backdrop;
                        const name = media.name + `, S${e.seasonId}: E${e.episode}`;
                        const overview = media.overview;
                        return {...e, backdrop, name, overview, found: false};
                    })
                });
            }

            const seasonsToRet = this.sortArray(show.seasons, 'seasonId', 'asc');
            return {...show, seasons: seasonsToRet};
        }
    }

    /**
     * @desc gets the next episode of a specific tv show in the database
     * @param mediaId - the id of the tv show to query the database for
     * @param episodeId - the id of the episode to query the database for
     * @param checkCase - whether to check if the episode is the first, next or last episode of the show
     */
    public async getNextEpisode(mediaId: number, episodeId: number, checkCase: 'next' | 'first' | 'last'): Promise<Episode | null> {
        const originalEpisode = await this.prisma.episode.findUnique({where: {id: episodeId}});
        const episodes = this.sortArray(await this.prisma.episode.findMany({where: {showId: mediaId}}), ['seasonId', 'episode'], ['asc', 'asc']);
        if ((originalEpisode && checkCase === 'next') || checkCase !== 'next') switch (checkCase) {
            case "next":
                const episodeIndex = episodes.findIndex(e => e.id === episodeId);
                return episodes.length > episodeIndex + 1 ? episodes[episodeIndex + 1] : null;

            case "first":
                return episodes[0] || null;

            case "last":
                return episodes[episodes.length - 1] || null;
        }

        return null;
    }

    /**
     * @desc modify an episode in the database
     * @param userId - the user modifying the episode
     * @param episode - the episode to be modified
     */
    public async modifyEpisode(userId: string, episode: EpisodeModSettings) {
        const data = await this.prisma.episode.update({
            where: {id: episode.episodeId}, data: {
                episode: episode.episode, seasonId: episode.seasonId,
            }
        });
        const mod = await this.prisma.video.findFirst({
            where: {episode: {id: episode.episodeId}}, include: {media: true, episode: true}
        });
        mod && await this.getSubtitlesForVideo(mod);
        return data;
    }

    /**
     * @desc gets the episode details for a specific season of a series
     * @param showId - the id of the show
     * @param seasonId - the id of the season
     * @param userId - the id of the user
     */
    public async getSeason(showId: number, seasonId: number, userId: string): Promise<SpringEpisode[]> {
        let response: SpringEpisode[] = [];
        let episodes = await this.prisma.episode.findMany({
            where: {showId, seasonId}, orderBy: [{seasonId: "asc"}, {episode: "asc"}], include: {media: true}
        });

        const seen = await this.prisma.watched.findMany({
            where: {
                userId, mediaId: showId
            }
        });

        let result = episodes.some(e => e.backdrop === null) ? await this.tmdb?.getSeason(episodes[0].media.tmdbId, seasonId) : null;

        if (result && result.episodes) {
            let season = result.episodes;
            for (let item of episodes) {
                const seenEpisode = seen.find(e => e.episodeId === item.id);
                const episode = season.find(e => e.episode_number === item.episode);
                const overview = episode && episode.overview && episode.overview !== "" ? episode.overview : null;
                const name = item.episode + '. ' + (episode && episode.name ? episode.name : "Episode " + item.episode);
                const backdrop = episode && episode.still_path ? "https://image.tmdb.org/t/p/original" + episode.still_path : null;

                const show: SpringEpisode = {
                    id: item.id,
                    season: item.seasonId,
                    episode: item.episode,
                    name,
                    type: "EPISODE",
                    backdrop,
                    overview,
                    position: seenEpisode ? seenEpisode.position > 939 ? 100 : seenEpisode.position / 10 : 0,
                    show: {
                        overview: episodes[0].media.overview,
                        id: showId,
                        name: episodes[0].media.name,
                        backdrop: episodes[0].media.backdrop,
                        logo: episodes[0].media.logo,
                        type: MediaType.SHOW,
                        poster: episodes[0].media.poster,
                        background: episodes[0].media.background
                    }
                }

                response.push(show);
                if (item.backdrop === null && episode && episode.still_path) {
                    await this.prisma.episode.update({
                        where: {id: item.id}, data: {
                            backdrop: "https://image.tmdb.org/t/p/original" + episode.still_path,
                            overview: episode.overview,
                            name: episode.name
                        }
                    });
                }
            }

        } else {
            for (let item of episodes) {
                const seenEpisode = seen.find(e => e.episodeId === item.id);
                const name = item.episode + '. ' + (item.name ? item.name : "Episode " + item.episode);

                const show: SpringEpisode = {
                    id: item.id,
                    season: item.seasonId,
                    episode: item.episode,
                    name,
                    type: "EPISODE",
                    backdrop: item.backdrop,
                    overview: item.overview,
                    position: seenEpisode ? seenEpisode.position > 939 ? 100 : seenEpisode.position / 10 : 0,
                    show: {
                        overview: episodes[0].media.overview,
                        id: showId,
                        name: episodes[0].media.name,
                        backdrop: episodes[0].media.backdrop,
                        logo: episodes[0].media.logo,
                        type: MediaType.SHOW,
                        poster: episodes[0].media.poster,
                        background: episodes[0].media.background
                    }
                }

                response.push(show);
            }
        }

        return response;
    }

    /**
     * @desc gets all media related to a media from tmdb that is not in the database
     * @param mediaId - the id of the media
     * @param page - the number of pages to get
     */
    public async getMissingMedia(mediaId: number, page: number = 2) {
        const media = await this.prisma.media.findUnique({where: {id: mediaId}});
        if (!media) return [] as tmdbMedia[];

        const database = await this.prisma.media.findMany({where: {AND: [{type: media.type}, {NOT: {id: mediaId}}]}});
        const recommendations = await this.tmdb?.getRecommendations(media.tmdbId, media.type, page) || [];
        return this.exclude(recommendations, database, 'id', 'tmdbId');
    }

    /**
     * @desc gets the media file information for a given media id
     * @param mediaId - the id of the media
     */
    public async getMediaForMod(mediaId: number): Promise<MedForMod | null> {
        const media = await this.prisma.media.findUnique({where: {id: mediaId}});
        if (media) {
            const location = media.type === MediaType.SHOW ? (await this.prisma.folder.findUnique({where: {showId: mediaId}}))?.location : (await this.prisma.video.findFirst({where: {mediaId}}))?.location;
            if (location) {
                const file = await this.drive?.getFile(location);
                if (file) {
                    const {name, poster, backdrop, logo, type, tmdbId} = media;
                    const year = media.release ? media.release.getFullYear() : 0;
                    return {
                        file,
                        mediaId,
                        name,
                        poster,
                        backdrop,
                        logo,
                        type,
                        tmdbId,
                        year,
                        stateType: 'MODIFY',
                        suggestions: []
                    };
                }
            }
        }

        return null;
    }

    /**
     * @desc gets the details of a specific video file in the database
     * @param videoId - the id of the video to query the database for
     * @param saveBackdrop - whether to save the backdrop of the video
     */
    public async getInfoFromVideoId(videoId: number, saveBackdrop: boolean) {
        const video = await this.prisma.video.findUnique({where: {id: videoId}, include: {media: true, episode: true}});
        if (video) {
            let {name, backdrop, overview, logo, type} = video.media;

            if (video.episode) {
                const episode = await this.getEpisode(video.episode.id);
                if (episode) {
                    const res: UpNext = {
                        name,
                        backdrop,
                        logo,
                        type,
                        videoId,
                        episodeBackdrop: episode.backdrop || undefined,
                        overview: episode.overview || overview,
                        episodeName: episode.name,
                        mediaId: video.media.id,
                        location: `/watch?episodeId=${video.episode.id}`,
                    }

                    return res;
                }
            }

            const res: UpNext = {
                name,
                backdrop,
                logo,
                type,
                episodeBackdrop: undefined,
                episodeName: undefined,
                overview,
                videoId,
                mediaId: video.media.id,
                location: '/watch?mediaId=' + video.media.id,
            }

            return res;
        }

        return null;
    }

    /**
     * @desc scans the episode file and adds the new episode to the database
     * @param file - the file to scan
     * @param seasons - the seasons in the show folder
     * @param tmdbEpisodes - the episodes in tmdb
     * @param episodes - the episodes in the database
     * @param ignoreScan - whether to scan the entire library thoroughly or quickly
     */
    public async scanEpisode(file: FileOrFolder, seasons: FileOrFolder[], tmdbEpisodes: tmdbEpisode[], episodes: FrameEpisodeScan[], ignoreScan: boolean) {
        const maxSeason = tmdbEpisodes[tmdbEpisodes.length - 1].season_number;
        const maxEpisode = tmdbEpisodes[tmdbEpisodes.length - 1].episode_number;
        const firstSeason = tmdbEpisodes[0].season_number;
        const firstEpisode = tmdbEpisodes[0].episode_number;
        let tmdbEpisode: tmdbEpisode[] = [];
        const showId = -1;

        const season = seasons.find(s => s.location === file.parent[0]);
        let seasonMatch = season?.name!.match(/Season\s(?<season>\d+)/i) || null;
        let seasonNumber = seasonMatch ? parseInt(seasonMatch.groups!.season) : -1;
        const name = this.prepareString(file.name!);
        const slimName = name.replace(/S\d+E\d+/i, '');

        let match = name.match(/(S|SEASON)\s*(?<season>\d+).*?(E|EPISODE)\s*(?<episode>\d+)/i) || null;
        match = match || name.match(/(?<season>\d+)x(?<episode>\d+)/) || null;
        match = match ? match : name.match(/^(?<firstEpisode>\d{2}) | (?<triEpisode>\d{3})/);
        seasonNumber = seasonNumber === -1 ? parseInt(match?.groups?.season || '') : seasonNumber;
        match = match ? match : name.match(/(?<anyEpisode>\d{2})/);
        let episodeNumber = parseInt(match?.groups?.episode || match?.groups?.triEpisode || match?.groups?.firstEpisode || match?.groups?.anyEpisode || '');
        episodeNumber = Math.floor(episodeNumber / (seasonNumber * 100)) === 1 ? episodeNumber - (seasonNumber * 100) : episodeNumber;

        for (const e of tmdbEpisodes) {
            const rgx = new RegExp(`(E|EPISODE)\\s*(0)*${e.episode_number}.*?(${this.prepareString(e.name!)})*`, 'i');
            const rgx2 = new RegExp(`(S|SEASON)\\s*(0)*${e.season_number}.*?(E|EPISODE)\\s*(0)*${e.episode_number}`);
            const rgx3 = new RegExp(`${this.prepareString(e.name!)}`);

            if (rgx.test(slimName) || rgx2.test(name) || rgx3.test(name)) tmdbEpisode.push(e);
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => name.includes(this.prepareString(e.name!)));
            if (temp.length > 0) tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.episode_number === episodeNumber || e.season_number === seasonNumber);
            if (temp.length > 0) tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.episode_number === episodeNumber && (match?.groups?.firstEpisode !== undefined || match?.groups?.triEpisode !== undefined));
            if (temp.length > 0) tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.season_number === seasonNumber && e.episode_number === episodeNumber);
            if (temp.length > 0) tmdbEpisode = temp;
        }

        const temp = tmdbEpisodes.find(e => e.season_number === seasonNumber && e.episode_number === episodeNumber);
        const alreadyAdded = episodes.find(e => e.seasonId === seasonNumber && e.episode === episodeNumber);

        if (!alreadyAdded && !isNaN(episodeNumber) && !isNaN(seasonNumber)) {
            const rgx = new RegExp(`(s|season)\\s*(0)*${seasonNumber}.*?(e|episode)\\s*(0)*${episodeNumber}`, 'i');
            if (rgx.test(name) && temp) {
                const backdrop = temp.still_path ? `https://image.tmdb.org/t/p/original${temp.still_path}` : null;
                const overview = temp.overview ? temp.overview : null;
                const name = temp.name ? temp.name : null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.location,
                    seasonId: temp.season_number,
                    episode: temp.episode_number,
                    showId
                };
                episodes.push(episode);

            } else if (temp) {
                const backdrop = temp.still_path ? `https://image.tmdb.org/t/p/original${temp.still_path}` : null;
                const overview = temp.overview ? temp.overview : null;
                const name = temp.name ? temp.name : null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.location,
                    seasonId: temp.season_number,
                    episode: temp.episode_number,
                    showId
                };
                episodes.push(episode);

            } else if (tmdbEpisode.length === 1) {
                const e = tmdbEpisode[0];
                const rgx3 = new RegExp(`${this.prepareString(e.name!)}`);
                const bool = [rgx3.test(slimName) && e.episode_number === episodeNumber, e.episode_number === episodeNumber && e.season_number === seasonNumber].filter(b => b).length > 1;

                if (bool) {
                    const backdrop = e.still_path ? `https://image.tmdb.org/t/p/original${e.still_path}` : null;
                    const overview = e.overview ? e.overview : null;
                    const name = e.name ? e.name : null;
                    const episode: FrameEpisodeScan = {
                        backdrop,
                        name,
                        overview,
                        location: file.location,
                        seasonId: e.season_number,
                        episode: e.episode_number,
                        showId
                    };
                    episodes.push(episode);
                }

            } else if (firstEpisode <= episodeNumber && episodeNumber <= maxEpisode && firstSeason <= seasonNumber && seasonNumber <= maxSeason) {
                const backdrop = null;
                const overview = null;
                const name = null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.location,
                    seasonId: seasonNumber,
                    episode: episodeNumber,
                    showId
                };
                episodes.push(episode);

            } else if (ignoreScan) {
                const backdrop = null;
                const overview = null;
                const name = null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.location,
                    seasonId: seasonNumber,
                    episode: episodeNumber,
                    showId
                };
                episodes.push(episode);
            }
        }
    }

    /**
     * @desc gets the details for a specific media
     * @param id - the id of the Media to get
     * @param userId - the id of the user to get the details for
     */
    public async getMedia(id: number, userId: string): Promise<SpringMedia | null> {
        const media = await this.prisma.media.findFirst({
            where: {id}, include: {castCrews: true, episodes: {distinct: ['seasonId']}}
        });
        if (media) {
            const {castCrews, production, episodes, poster, created, updated, collection, release, ...rest} = media;

            const releaseDate = release?.toUTCString().substr(8, 8) || 'N/A';
            const cast = castCrews.filter(e => e.type === CastType.ACTOR).map(e => {
                const {name, type, character, job} = e;
                return {id: e.tmdbId, name, type, character, job};
            });
            const producers = castCrews.filter(e => e.type === CastType.PRODUCER).map(e => {
                const {name, type, character, job} = e;
                return {id: e.tmdbId, name, type, character, job};
            });
            const directors = castCrews.filter(e => e.type === CastType.DIRECTOR).map(e => {
                const {name, type, character, job} = e;
                return {id: e.tmdbId, name, type, character, job};
            });
            const writers = castCrews.filter(e => e.type === CastType.WRITER).map(e => {
                const {name, type, character, job} = e;
                return {id: e.tmdbId, name, type, character, job};
            });

            const season = this.sortArray(episodes, 'seasonId', 'asc');
            let sections = season.length ? season.length === 1 && season[0].seasonId === 1 ? ['Episodes'] : ['Seasons'] : [];

            let seasons: SpringEpisode[] = sections[0] === 'Episodes' ? await this.getSeason(media.id, 1, userId) : [];
            seasons = sections[0] !== 'Episodes' ? season.map(e => ({
                id: e.seasonId,
                season: e.seasonId,
                episode: 0,
                name: `Season ${e.seasonId}`,
                type: 'SEASON',
                backdrop: null,
                overview: null,
                show: {
                    id: media.id,
                    name: media.name,
                    overview: media.overview,
                    backdrop: media.backdrop,
                    logo: media.logo,
                    type: media.type,
                    poster: media.poster,
                    background: media.background
                }
            })) : seasons;
            const prod = production as { name: string, id: string }[];
            const coll = collection as { name: string, id: number, poster: string } | undefined;
            let recommendations = (await this.getSimilarMedia(media.id)).map(e => ({
                id: e.id, name: e.name, poster: e.poster, background: e.background, type: e.type
            }));
            sections = [...sections, recommendations.length ? 'More like this' : 'Featured media', 'Details'];
            recommendations = recommendations.length ? recommendations : this.shuffle(await this.prisma.media.findMany({
                select: {
                    id: true, poster: true, name: true, type: true, background: true
                }, where: {AND: [{type: media.type}, {NOT: {id: media.id}}]}
            }), 20, media.id);

            return {
                ...rest,
                cast,
                producers,
                directors,
                writers,
                sections,
                recommendations,
                poster,
                seasons,
                production: prod,
                collection: coll,
                release: releaseDate
            };
        }

        return null;
    }

    /**
     * @desc Get all the media similar to this media that is available on the database
     * @param id - The id of the media
     * @param page - The page number
     */
    public async getSimilarMedia(id: number, page?: number) {
        let collections: Media[] = [];
        page = page || 2;
        const media = await this.prisma.media.findUnique({
            where: {id}
        });

        if (media) {
            if (media.collection) {
                const col = media.collection as any as { id: number };
                collections = await this.prisma.media.findMany({
                    where: {
                        AND: [{
                            collection: {
                                path: ['id'], equals: col.id
                            }
                        }, {NOT: {id: id}}]
                    }, orderBy: {release: 'asc'}
                });
            }

            const recon = await this.tmdb?.getRecommendations(media.tmdbId, media.type, page) || [];
            const tmdbIds = recon.map(e => e.id);
            let recommendations = await this.prisma.media.findMany({
                where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]},
            });
            collections = this.uniqueId([...collections, ...recommendations], 'id');
        }

        return collections.filter(e => e.id !== id);
    }

    /**
     * @desc searches TMDB for the best match for a given file
     * @param item - the file to be scanned
     * @param type - the type of media to be scanned
     */
    public async scanMediaHelper(item: FileOrFolder, type: MediaType) {
        const ext = path.extname(item.name!)
        let name = this.prepareString(item.name!), year = 0;
        let backup: ScanPick[] = [], results: ScanPick[] = [];

        if (item.mimeType !== 'application/vnd.google-apps.folder' && type === MediaType.SHOW) return {backup, results};

        else if ((item.mimeType === 'application/vnd.google-apps.folder' && type === MediaType.MOVIE) || (type === MediaType.MOVIE && !(ext === '.mp4' || ext === '.m4v'))) return {
            backup, results
        };

        if (type === MediaType.MOVIE) {
            let matches = name.match(/(?<name>^\d{4}.*?)\s+(?<year>\d{4})/);
            matches = matches ? matches : name.match(/(?<name>(^\w+.*?\d+)|^\w+.*?)\s+(?<year>\d{4})/);

            if (matches && matches.groups) {
                name = matches.groups.name;
                year = parseInt(matches.groups.year);

            } else {
                let data = item.name!.match(/(?<name>^.*?)\d+p/);
                let tmpName = data && data.groups && data.groups.name ? data.groups.name : item.name!;
                tmpName = rename(tmpName, dicDo);
                data = tmpName.match(/\d{4}/g);
                let temp = data && data.length ? data[data.length - 1] : new Date().getFullYear();
                let tmpYear = parseInt(`${temp}`);
                tmpName = tmpName.replace(`${temp}`, '');
                if (tmpYear !== new Date().getFullYear() && tmpName !== rename(item.name!, dicDo)) {
                    year = tmpYear;
                    name = tmpName;
                }
            }

            year = parseInt(`${year}`);
        }

        let response = await this.tmdb?.searchMedia(type, name) || [];

        results = response.map(item => {
            return {
                tmdbId: item.id,
                name: item.title || item.name || '',
                popularity: item.popularity,
                drift: this.levenshtein(name, this.prepareString(item.title || item.name || '')),
                backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                year: new Date(type === MediaType.MOVIE ? item.release_date : item.first_air_date).getFullYear()
            }
        });
        backup = this.sortArray(results, ['drift', 'popularity'], ['asc', 'desc']);

        if (type === MediaType.SHOW && backup.length > 0) backup = backup.length ? [backup[0]] : [];

        else if (type === MediaType.MOVIE) {
            backup = backup.filter(item => (year - 1 <= item.year && item.year <= year + 1));
            backup = backup.length > 1 ? backup.filter(item => item.year === year && item.drift < 3) : backup;
            backup = backup.length > 1 ? backup.filter(item => item.drift < 2) : backup;
            backup = backup.length > 1 ? backup.filter(item => item.drift < 1) : backup;

            if (backup.length !== 1 || (year === new Date().getFullYear() || year === 0)) {
                backup = results.filter(item => item.backdrop !== null);
                backup = this.sortArray(backup, ['drift', 'popularity'], ['asc', 'desc']);
                backup = backup.length ? [backup[0]] : [];
            }
        }

        return {backup, results};
    }

    /**
     * @desc scans a new media item and attempts to add it to the database
     * @param item - the show folder to scan
     * @param type - the type of media to be scanned
     * @param media - the media already in the database
     * @param keepOld - whether to keep the old media or not
     */
    public async scanMedia(item: FileOrFolder, type: MediaType, media: Media[], keepOld = false) {
        let obj: { name: string, tmdbId: number, year: number };
        let {backup, results} = await this.scanMediaHelper(item, type);

        if (results.length === 1 || backup.length === 1) {
            obj = backup.length ? backup[0] : results[0];

            const existing = media.find(e => e.tmdbId === obj.tmdbId && e.type === type);

            if (existing !== undefined) {
                if (keepOld) {
                    await this.drive.deleteFileOrFolder(item.location);
                    return;
                }

                const video = type === MediaType.SHOW ? await this.prisma.folder.findFirst({where: {showId: existing.id}}) : await this.prisma.video.findFirst({where: {mediaId: existing.id}});
                if (video) await this.checkAndDelete(video.location, item.location as string, this.moviesLocation === '' || this.showsLocation === '');
                return;
            }

            const imageData = await this.tmdb?.getImagesForAutoScan(obj.tmdbId, obj.name || '', type, obj.year) || {
                poster: '', backdrop: '', logo: ''
            };
            const res = await this.buildMediaObj(imageData, obj, type);
            if (res) {
                await this.addMedia(res.mediaData, res.castCrew, item.location as string);
                return;
            }
        }
    }

    /**
     * @desc scans the show folder and adds new episodes to be added to the database
     * @param mediaId - the id of the show to be scanned
     * @param thoroughScan - whether to scan the entire library thoroughly or quickly
     * @param ignoreScan - whether to add ignore irregular files to the database
     * @param users - the users to be notified of the scan
     */
    public async scanShow(mediaId: number, thoroughScan: boolean, ignoreScan: boolean, users?: (User & { watched: (Watched & { episode: Episode | null })[] })[]) {
        users = users || await this.prisma.user.findMany({
            where: {role: {not: Role.GUEST}},
            include: {watched: {include: {episode: true}}}
        });

        const media = await this.prisma.media.findUnique({
            where: {id: mediaId}, include: {folder: true, episodes: {include: {video: true}}}
        });

        const tmdbMedia = await this.tmdb?.getMedia(media?.tmdbId || -1, MediaType.SHOW);
        if (media && media.folder && tmdbMedia) {
            const episodes = media.episodes;
            let episodeFiles = (await this.drive?.recursiveReadFolder(media.folder.location)) || [];

            if (episodes.length === tmdbMedia.number_of_episodes && !thoroughScan) {
                console.log(`${media.name} is up to date`);
                return;
            }

            episodeFiles = thoroughScan ? episodeFiles : episodeFiles.filter(f => episodes.every(e => e.video.location !== f.location));
            const episodesToScan = episodeFiles.filter(e => e.name?.endsWith('.m4v') || e.name?.endsWith('.mp4') || e.name?.endsWith('.webm'));
            const toDelete = episodeFiles.filter(e => !e.name?.endsWith('.m4v') && !e.name?.endsWith('.mp4') && !e.name?.endsWith('.webm'));

            if (episodesToScan.length === episodes.length && !thoroughScan) {
                console.log(`There are no new episodes for ${media.name}`);
                return;
            }

            let episodeResults = [] as FrameEpisodeScan[];
            let videoLocations = [] as string[];

            const Promises: any[] = [];
            toDelete.forEach(file => Promises.push(this.drive.deleteFileOrFolder(file.location)));

            let tmdbSeasons = await this.tmdb?.getAllEpisodes(tmdbMedia.id) || {episodes: [], tmdbId: media.tmdbId};
            const seasons = (await this.drive?.readFolder(media.folder.location)) || [];
            let tmdbEpisodes = this.sortArray(tmdbSeasons.episodes.map(e => e.season).flat(), ['season_number', 'episode_number'], ['asc', 'asc']);

            episodesToScan.forEach(episode => Promises.push(this.scanEpisode(episode, seasons, tmdbEpisodes, episodeResults, ignoreScan)));
            await Promise.all(Promises);

            if (!thoroughScan) {
                const alreadyPresentEpisodes = this.intersect(episodeResults, episodes, ['seasonId', 'episode'], ['seasonId', 'episode']);
                const oldEpisodes = this.intersect(episodes, alreadyPresentEpisodes, ['seasonId', 'episode'], ['seasonId', 'episode']);
                const newEpisodes = this.exclude(episodeResults, alreadyPresentEpisodes, ['seasonId', 'episode'], ['seasonId', 'episode']);
                videoLocations = oldEpisodes.map(e => e.video.location);

                const promises = oldEpisodes.map(async e => {
                    const newEpisode = alreadyPresentEpisodes.find(n => n.seasonId === e.seasonId && n.episode === e.episode);
                    if (newEpisode) {
                        await this.prisma.video.update({
                            where: {id: e.video.id},
                            data: {location: newEpisode.location}
                        })
                        return this.drive.deleteFileOrFolder(e.video.location);
                    }
                    return false;
                })

                await Promise.all(promises);
                episodeResults = newEpisodes;

                if (newEpisodes.length === 0) {
                    console.log(`There are no new episodes for ${media.name}`);
                    return;
                }
            }

            videoLocations = videoLocations.concat(episodeResults.map(e => e.location));

            try {
                await this.prisma.video.deleteMany({
                    where: {
                        location: {in: videoLocations},
                    }
                });
                const data: Omit<Video, 'id'>[] = episodeResults.map(e => {
                    return {
                        english: null, french: null, german: null, mediaId: media.id, location: e.location,
                    }
                })
                await this.prisma.video.createMany({data});

                const videos = await this.prisma.video.findMany({
                    where: {
                        location: {in: episodeResults.map(e => e.location)},
                    }, include: {media: true, episode: true}, orderBy: {id: 'desc'}
                });
                const episodes: Omit<Episode, 'id'>[] = episodeResults.map(e => {
                    const video = videos.find(v => v.location === e.location);
                    return {
                        backdrop: e.backdrop,
                        episode: e.episode,
                        overview: e.overview,
                        seasonId: e.seasonId,
                        showId: media.id,
                        videoId: video!.id,
                        name: e.name,
                        created: new Date(),
                        updated: new Date(),
                    }
                });
                const dbEpisodes = await this.prisma.episode.createMany({data: episodes});

                if (dbEpisodes.count > 0) {
                    if (videoLocations.length > 0) {
                        await this.prisma.media.update({
                            where: {id: media.id}, data: {
                                updated: new Date(),
                            }
                        });
                        const show = await this.prisma.media.findUnique({
                            where: {id: media.id}, include: {episodes: true}
                        });
                        if (show) {
                            const promises = (users || []).map(e => this.updateUserSeen(show, e));
                            await Promise.all(promises);
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    /**
     * @desc modify a media entry in the database
     * @param userId - the user modifying the media
     * @param modMedia - the media to be modified
     */
    public async modifyMedia(userId: string, modMedia: MedForMod & { location: string }) {
        const {tmdbId, type, name, poster, backdrop, logo, year, mediaId} = modMedia;
        const data = await this.buildMediaObj({backdrop, logo, poster}, {tmdbId, year, name}, type);

        if (data) {
            const {mediaData, castCrew} = data;
            const media = modMedia.stateType === 'MODIFY' ? await this.prisma.media.update({
                where: {id: mediaId}, data: {...mediaData}
            }) : await this.prisma.media.create({
                data: {...mediaData, created: new Date(), updated: new Date()}
            });

            if (media) {
                const med = await this.prisma.media.findUnique({
                    where: {id: media.id}, include: {folder: true, videos: true}
                });

                if (med?.type === MediaType.SHOW) await this.prisma.folder.upsert({
                    where: {showId: med.id}, create: {
                        location: modMedia.location, showId: med.id,
                    }, update: {
                        location: modMedia.location,
                    }
                });

                else if (med?.type === MediaType.MOVIE) {
                    await this.prisma.video.deleteMany({
                        where: {AND: [{mediaId: med.id}, {NOT: {location: modMedia.location}}]}
                    });

                    await this.prisma.video.upsert({
                        where: {location: modMedia.location}, create: {
                            location: modMedia.location, mediaId: med.id,
                        }, update: {
                            location: modMedia.location,
                        }
                    });
                }

                await this.prisma.castCrew.deleteMany({
                    where: {mediaId}
                });
                await this.prisma.castCrew.createMany({
                    data: castCrew.map(item => {
                        return {
                            ...item, mediaId: media.id
                        }
                    })
                });

                await this.scanShow(media.id, false, true);
                await this.getSubtitles(media.id);

                return true;
            }
        }
    }

    /**
     * @desc scans the locations provided for new media to be added to the database
     * @param moviesLocation - the location of the movies
     * @param showsLocation - the location of the shows
     */
    public async scanLibrary(moviesLocation: string, showsLocation: string) {
        if (showsLocation === '' && moviesLocation === '') return;

        const media = await this.prisma.media.findMany();
        const videos = await this.prisma.video.findMany();
        const folder = await this.prisma.folder.findMany();

        let shows = await this.drive.readFolder(showsLocation) || [];
        shows = shows.filter(file => folder.every(show => show.location !== file.location));
        for (const show of shows) await this.scanMedia(show, MediaType.SHOW, media);

        let movies = await this.drive.recursiveReadFolder(moviesLocation) || [];
        movies = movies.filter(file => videos.every(video => video.location !== file.location));
        for (const movie of movies) await this.scanMedia(movie, MediaType.MOVIE, media);
    }

    /**
     * @desc scans the locations provided for new media to be added to the database
     */
    public async autoScan() {
        try {
            await this.scanLibrary(this.moviesLocation || '', this.showsLocation || '');
            await this.scanAllEpisodes(false, true);
            await this.scanAllSubs();
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @desc scans the media on the database for new subtitles
     */
    public async scanAllSubs() {
        const videos = await this.prisma.video.findMany({
            include: {media: true, episode: true}, where: {OR: [{english: null}, {french: null}, {german: null}]}
        });

        await this.handleSubtitles(videos);
    }

    /**
     * @desc scans the folders in the database for new episodes to be added to the database
     * @param thoroughScan - whether to scan the entire library thoroughly or quickly
     * @param ignoreScan - whether to add irregular episodes
     */
    public async scanAllEpisodes(thoroughScan: boolean, ignoreScan = true) {
        const users = await this.prisma.user.findMany({
            where: {role: {not: Role.GUEST}},
            include: {watched: {include: {episode: true}}}
        });
        const media = await this.prisma.media.findMany({where: {type: MediaType.SHOW}, orderBy: {updated: 'desc'}});

        for await (const show of media)
            await this.scanShow(show.id, thoroughScan, ignoreScan, users);

        await this.scanAllSubs();
    }

    /**
     * @desc checks if a media exists in the database
     * @param tmdbId - the tmdb id of the media
     * @param type - the type of media
     */
    public async checkIfMediaExists(tmdbId: number, type: MediaType): Promise<{ name: string, location: string } | null> {
        const media = await this.prisma.media.findFirst({where: {tmdbId, type}, include: {folder: true, videos: true}});
        return media ? {
            name: media.name, location: media.folder ? media.folder.location : media.videos[0].location
        } : null;
    }

    /**
     * @desc gets the recently added media in the database
     * @param limit - the number of media to return
     */
    public async getRecentlyAdded(limit: number) {
        return await this.prisma.media.findMany({
            orderBy: [{updated: 'desc'}], take: limit
        })
    }

    /**
     * @desc searches for a media query on TMDB
     * @param query - the query to search for
     * @param type - the type of media to search for
     */
    public async searchForMedia(query: string, type: MediaType) {
        const media = (await this.tmdb?.searchMedia(type, query)) || [];
        const mediaIds = media.map(m => m.id);
        const mediaDBs = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: mediaIds}}, {type}]}, include: {folder: true, videos: true}
        });

        const intersection = media.filter(m => mediaDBs.find(db => db.tmdbId === m.id));
        const excluded = media.filter(m => !intersection.find(i => i.id === m.id));
        const mediaToAdd: FrontMediaSearch[] = excluded.map(m => ({
            tmdbId: m.id,
            name: m.name || m.title || '',
            inLibrary: false,
            libraryName: null,
            drift: this.levenshtein(query, m.name || m.title || ''),
            year: new Date(m.release_date || m.first_air_date).getFullYear(),
            libraryLocation: null
        }));

        const existsInDb: FrontMediaSearch[] = intersection.map(m => {
            const media = mediaDBs.find(db => db.tmdbId === m.id);
            return {
                tmdbId: m.id,
                name: m.name || m.title || '',
                inLibrary: true,
                libraryName: media?.name || null,
                drift: this.levenshtein(query, m.name || m.title || ''),
                year: new Date(m.release_date || m.first_air_date).getFullYear(),
                libraryLocation: media?.folder?.location || media?.videos[0].location || null
            }
        });

        return this.sortArray(mediaToAdd.concat(existsInDb), 'drift', 'asc');
    }

    /**
     * @desc get new contents to add to the database
     */
    public async getNewContent() {
        const dbase = await this.prisma.media.findMany();
        const movies = dbase.filter(m => m.type === MediaType.MOVIE);
        const shows = dbase.filter(m => m.type === MediaType.SHOW);
        const trending = await this.tmdb?.getTrending(4) || {movies: [], shows: []};
        const popular = await this.tmdb?.getPopular(4) || {movies: [], shows: []};
        const topRated = await this.tmdb?.getTopRated(4) || {movies: [], shows: []};

        const moviesToDownload = this.uniqueId(trending.movies.concat(popular.movies, topRated.movies), 'id');
        const showsToDownload = this.uniqueId(trending.shows.concat(popular.shows, topRated.shows), 'id');

        const sortedMovies = this.sortArray(moviesToDownload, 'popularity', 'desc');
        const sortedShows = this.sortArray(showsToDownload, 'popularity', 'desc');

        const moviesToAdd = this.exclude(sortedMovies, movies, 'id', 'tmdbId');
        const showsToAdd = this.exclude(sortedShows, shows, 'id', 'tmdbId');

        const data: ({ url: string, size: string } | null)[] = [];

        for (const e of moviesToAdd)
            data.push(await this.deluge.addMagnet(e.id, MediaType.MOVIE))

        for (const e of showsToAdd)
            data.push(await this.deluge.addMagnet(e.id, MediaType.SHOW))

        await this.deluge.addTorrents(data);
        await this.deluge.parseFeed();
        await this.getMissingEpisodes();
    }

    /**
     * @desc gets the lists of currently trending media on TMDB and compares it to the local database sorted by popularity
     * @param page - the page of the list to get
     */
    public async getTrending(page?: number): Promise<(Pick<SpringMedia, 'id' | 'poster' | 'logo' | 'backdrop' | 'background' | 'overview' | 'name' | 'type' | 'trailer'> & { popularity: number, collection: any })[]> {
        const trending = (await this.tmdb?.getTrending(page || 1)) || {movies: [], shows: []};
        const movies = trending.movies.map(e => e.id);
        const shows = trending.shows.map(e => e.id);
        const movieMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: movies}}, {type: MediaType.MOVIE}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });
        const showMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: shows}}, {type: MediaType.SHOW}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });

        const movieRes = this.intersect(movieMedia, trending.movies, 'tmdbId', 'id', 'popularity');
        const showRes = this.intersect(showMedia, trending.shows, 'tmdbId', 'id', 'popularity');
        return this.sortArray([...movieRes, ...showRes], 'popularity', 'desc');
    }

    /**
     * @desc gets the lists of currently popular media on TMDB and compares it to the local database sorted by popularity
     * @param page - the page to get the results from
     */
    public async getPopular(page?: number): Promise<(Pick<SpringMedia, 'id' | 'poster' | 'logo' | 'backdrop' | 'background' | 'overview' | 'name' | 'type' | 'trailer'> & { popularity: number, collection: any })[]> {
        const popular = (await this.tmdb?.getPopular(page || 1)) || {movies: [], shows: []};
        const movies = popular.movies.map(e => e.id);
        const shows = popular.shows.map(e => e.id);
        const movieMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: movies}}, {type: MediaType.MOVIE}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                release: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });
        const showMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: shows}}, {type: MediaType.SHOW}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                release: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });

        const movieRes = this.intersect(movieMedia, popular.movies, 'tmdbId', 'id', 'popularity');
        const showRes = this.intersect(showMedia, popular.shows, 'tmdbId', 'id', 'popularity');
        return this.sortArray([...movieRes, ...showRes], 'release', 'desc');
    }

    /**
     * @desc gets the lists of currently top-rated media on TMDB and compares it to the local database sorted by popularity
     * @param page - the page to get the results from
     */
    public async getTopRated(page?: number): Promise<(Pick<SpringMedia, 'id' | 'poster' | 'logo' | 'backdrop' | 'background' | 'overview' | 'name' | 'type' | 'trailer'> & { popularity: number, collection: any })[]> {
        const topRated = (await this.tmdb?.getTopRated(page || 1)) || {movies: [], shows: []};
        const movies = topRated.movies.map(e => e.id);
        const shows = topRated.shows.map(e => e.id);
        const movieMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: movies}}, {type: MediaType.MOVIE}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });
        const showMedia = await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: shows}}, {type: MediaType.SHOW}]}, select: {
                trailer: true,
                overview: true,
                name: true,
                logo: true,
                backdrop: true,
                background: true,
                collection: true,
                id: true,
                poster: true,
                type: true,
                tmdbId: true
            }
        });

        const movieRes = this.intersect(movieMedia, topRated.movies, 'tmdbId', 'id', 'popularity');
        const showRes = this.intersect(showMedia, topRated.shows, 'tmdbId', 'id', 'popularity');
        return this.sortArray([...movieRes, ...showRes], 'popularity', 'desc');
    }

    /**
     * @desc searches through regex or levenshtein algorithm based on the search boolean
     * @param searchValue - the search value
     * @param search - REGEX |! Levenshtein
     */
    public async search<T extends gridOpt>(searchValue: string, search: T): Promise<SearchPicker<T>> {
        if (search === 'grid') {
            const media = (await this.prisma.media.findMany({
                select: {name: true, backdrop: true, logo: true, type: true, id: true},
                where: {name: {contains: searchValue, mode: "insensitive"}}
            })).map(e => {
                return {...e, length: e.name.length}
            });

            const begins = media.filter(e => e.name.toLowerCase().startsWith(searchValue.toLowerCase()));
            const response: any = this.sortArray(this.uniqueId(begins.concat(media), 'id'), 'length', 'asc');

            if (response.length > 0) return response.slice(0, 32) as SearchPicker<T>;

            return await this.prisma.media.findMany({
                select: {name: true, backdrop: true, logo: true, type: true, id: true}, where: {
                    castCrews: {
                        some: {
                            OR: [{
                                name: {
                                    contains: searchValue, mode: "insensitive"
                                }
                            }, {character: {contains: searchValue, mode: "insensitive"}}]
                        }
                    }
                }, skip: 0, take: 32, orderBy: {vote_average: "desc"}
            }) as SearchPicker<T>;

        } else {
            let data = await this.prisma.media.findMany({
                select: {name: true, type: true, id: true}, orderBy: {name: 'asc'}
            });
            return this.sortArray(data.map(e => {
                const words = e.name.split(' ');
                const data = this.sortArray(words.map(e => {
                    return {
                        diff: this.levenshtein(searchValue, e),
                    }
                }), 'diff', 'asc');
                return {...e, diff: data[0].diff}
            }), 'diff', 'asc') as SearchPicker<T>;
        }
    }

    /**
     * @desc gets the subtitles for every video of a mwdia
     * @param mediaId - the id of the media to get the subtitles for
     */
    public async getSubtitles(mediaId: number): Promise<void> {
        const videos = await this.prisma.video.findMany({where: {mediaId}, include: {media: true, episode: true}});
        await this.handleSubtitles(videos);
    }

    /**
     * @desc does the actual scan for the subtitles of a specific video file
     * @param video - the video file to be scanned
     * @param auth - the authentication object
     */
    public async getSubtitlesForVideo(video: (Video & { media: Media, episode: Episode | null }), auth?: string) {
        let returnSubs: { language: string, url: string, label: string, lang: string }[] = [];
        if (this.OpenSubtitles) {
            const file = await this.drive.getFile(video.location) || null;
            if (file) {
                let obj: any = null;
                if (video.episode) {
                    const external = await this.tmdb?.getExternalId(video.media.tmdbId, MediaType.SHOW);
                    if (external) {
                        obj = {
                            season: video.episode.seasonId,
                            filesize: file.size,
                            filename: file.name,
                            episode: video.episode.episode,
                            imdbid: external.imdb_id
                        };
                    }
                } else {
                    const external = await this.tmdb?.getExternalId(video.media.tmdbId, MediaType.MOVIE);
                    if (external) obj = {filesize: file.size, filename: file.name, imdbid: external.imdb_id};
                }

                if (obj) {
                    obj.extensions = ['srt', 'vtt'];
                    const keys = ['en', 'fr', 'de'];
                    const lang = ['english', 'french', 'german'];
                    const labels = ['English', 'Français', 'Deutsch'];

                    const subs: { [p: string]: string | null } | null = await this.OpenSubtitles.search(obj)
                        .then((temp: { [x: string]: { url: any; }; } | undefined) => {
                            if (temp) {
                                let item: { [key: string]: string } = {};
                                keys.forEach((value, pos) => {
                                    item[lang[pos]] = temp[value] === undefined ? null : temp[value].url;
                                });
                                return item;
                            } else return null;
                        }).catch((error: any) => {
                            console.log(error)
                            return null;
                        })

                    if (subs) {
                        await this.prisma.video.update({where: {id: video.id}, data: subs});
                        if (auth) returnSubs = keys.map((value, pos) => {
                            return {
                                language: this.capitalize(lang[pos]),
                                url: subs[lang[pos]] ? '/api/stream/subtitles?auth=' + auth + '&language=' + lang[pos] : '',
                                label: labels[pos],
                                lang: value
                            }
                        }).filter(x => x.url !== '');
                    }
                }
            }
        }

        return returnSubs;
    }

    /**
     * @desc gets the first video of a media in a collection
     * @param itemId - the id of the collection to get the video for
     */
    public async getFirstVideoInCollection(itemId: number): Promise<number | null> {
        let collection = await this.prisma.media.findMany({
            where: {
                collection: {
                    path: ['id'], equals: itemId
                }
            }, orderBy: {release: 'asc'}
        });

        if (collection.length > 0)
            return collection[0].id;

        else return null;
    }

    /**
     * @desc gets the data for the browse library page
     * @param type the type of media to get
     */
    public async getDataForBrowse(type: MediaType): Promise<BrowseData> {
        const trendingData = await this.getTrending();
        let libraryData = trendingData.map(e => {
            const {id, backdrop, type, trailer, logo, name, overview} = e;
            return {id, backdrop, type, trailer, logo, name, overview}
        }).filter(e => e.logo !== null && e.type === type).slice(0, 10) as Banner[];
        const last = libraryData.pop();
        const response = [last, ...libraryData] as Banner[];

        const genres = await this.getGenres(type);
        const decades = await this.getDecades(type);

        return {
            trending: response,
            genres, decades
        }
    }

    /**
     * @desc this is a recursive function that handles the subtitles logic
     * @param subs - the videos array to be scanned
     */
    protected async handleSubtitles(subs: (Video & { media: Media, episode: Episode | null })[]): Promise<void> {
        if (this.OpenSubtitles) {
            while (subs.length) {
                await this.getSubtitlesForVideo(subs[0]);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        subs.shift();
                        resolve();
                    }, 3000)
                })
            }
        }
    }

    /**
     * @desc gets the list of all the genres of the media in the database
     */
    private async getGenres(type: MediaType): Promise<string[]> {
        let data = await this.prisma.media.findMany({
            where: {type}, select: {genre: true}
        });
        let string: string = data.map(item => item.genre).join(' ');
        let genres = string.replace(/ &|,/g, '').split(' ').map(genre => {
            return {genre};
        }).filter(item => item.genre !== '');

        genres = this.sortArray(this.uniqueId(genres, 'genre'), 'genre', 'asc');
        return genres.map(e => e.genre);
    }

    /**
     * @desc gets the list of all the decades of the media in the database
     */
    private async getDecades(type: MediaType): Promise<string[]> {
        let data = await this.prisma.media.findMany({
            select: {release: true}, where: {type}
        });
        const years = data.map(item => item.release?.getFullYear() || 0).filter(item => item !== 0);
        const decades = years.map(e => {
            return {decade: `${Math.floor(e / 10) * 10}s`};
        });
        return this.sortArray(this.uniqueId(decades, 'decade'), 'decade', 'asc').map(e => e.decade);
    }

    /**
     * @desc builds the media object to be added to the database
     * @param imageData - the image data to be added to the media object
     * @param obj - the media object to be added to the database
     * @param type - the type of media to be added to the database
     */
    private async buildMediaObj(imageData: { poster: string, backdrop: string, logo: string | null }, obj: { name: string, tmdbId: number, year: number }, type: MediaType) {
        const rep = await this.tmdb?.getMedia(obj.tmdbId, type);
        if (!rep) return null;
        if (imageData.poster === '' || imageData.backdrop === '') return null;

        let runtime: string;
        const genre = this.tmdb?.getGenre(rep) || 'Unknown';
        const rating = this.tmdb?.getRating(rep, type) || {rating: 'unrated', release: null};
        const trailer = this.tmdb?.getTrailer(rep) || '';
        const production = this.tmdb?.getProd(rep) || [];
        const castCrew = this.tmdb?.getCast(rep) || [];

        const collection = rep.belongs_to_collection ? {
            name: rep.belongs_to_collection.name,
            id: rep.belongs_to_collection.id,
            poster: rep.belongs_to_collection.poster_path ? 'https://image.tmdb.org/t/p/original' + rep.belongs_to_collection.poster_path : null
        } : undefined;

        const background = (await this.makeRequest<{ color: string }>('https://imag-convert.vercel.app/api', {
            type: 'averageColor', image: imageData.poster
        }, "POST"))?.color || 'rgba(1, 16, 28, .5)';

        if (type === MediaType.MOVIE) {
            let hours = Math.floor(rep.runtime / 60);
            let tempHours = hours !== 0 ? hours > 1 ? hours + " hours, " : hours + " hour, " : "";
            runtime = tempHours + (rep.runtime % 60) + " mins.";

        } else runtime = rep.episode_run_time.length ? rep.episode_run_time[0] + " mins." : "";

        const mediaData: Med = {
            urlKey: this.generateKey(13, 1),
            collection,
            production,
            overview: rep.overview || '',
            trailer, ...rating,
            runtime, ...imageData,
            background,
            genre,
            tmdbId: obj.tmdbId,
            type,
            name: obj.name,
            vote_average: rep.vote_average,
        }

        return {mediaData, castCrew};
    }

    /**
     * @description adds a successful scan to the database
     * @param med - the media to add
     * @param casts - the cast for the media to be added to the castCrew table
     * @param location - the location of the media
     */
    private async addMedia(med: Med, casts: { job?: string, character?: string, name: string, tmdbId: number, type: CastType }[], location: string) {
        try {
            const media = await this.prisma.media.upsert({
                where: {tmdbId_type: {tmdbId: med.tmdbId, type: med.type}}, create: {
                    ...med, created: new Date(), updated: new Date()
                }, update: {...med, updated: new Date()}
            });

            media.type === MediaType.MOVIE ? await this.prisma.video.upsert({
                where: {location},
                create: {english: null, french: null, german: null, location, mediaId: media.id},
                update: {}
            }) : await this.prisma.folder.upsert({
                where: {location}, create: {location, showId: media.id}, update: {}
            });

            await this.prisma.castCrew.deleteMany({where: {mediaId: media.id}});
            const data = casts.map(cast => ({...cast, mediaId: media.id}));
            await this.prisma.castCrew.createMany({data});

            if (media.type === MediaType.SHOW) await this.prisma.folder.deleteMany({where: {AND: [{showId: media.id}, {NOT: {location}}]}});

            if (media.type === MediaType.SHOW) await this.scanShow(media.id, true, true);

        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @desc tries to decide between two versions of a media which to keep and which to delete
     * @param oldMedia - the old media
     * @param newMedia - the new media
     * @param spare - the media to keep
     */
    private async checkAndDelete(oldMedia: string, newMedia: string, spare = false): Promise<boolean> {
        const oldDrive = await this.drive?.getFile(oldMedia);
        const newDrive = await this.drive?.getFile(newMedia);

        if (oldDrive && oldDrive.isFolder && newDrive && newDrive.isFolder && !spare)
            return this.drive?.deleteFileOrFolder(newMedia);

        const deleteFile = async (file: string, keep?: string) => {
            if (!spare) await this.drive.deleteFileOrFolder(file);
            if (keep) await this.prisma.video.update({where: {location: file}, data: {location: keep}});
        }

        if (newDrive && !oldDrive) await this.prisma.video.update({
            where: {location: oldMedia}, data: {location: newMedia}
        });

        if (oldDrive && newDrive) {
            console.log('both files exist');
            console.log(oldDrive, newDrive);
            if (oldDrive.name === newDrive.name) if (oldDrive.size! >= newDrive.size!) await deleteFile(newMedia); else await deleteFile(oldMedia, newMedia);

            else {
                const yts1 = /\[YTS]/.test(newDrive.name as string);
                const yts2 = /\[YTS]/.test(newDrive.name as string);

                switch (true) {
                    case yts1 && !yts2:
                        await deleteFile(newMedia);
                        break;
                    case yts2 && !yts1:
                        await deleteFile(oldMedia, newMedia);
                        break;
                    default:
                        return false;
                }
            }
        }

        return true;
    }

    /**
     * @desc updates a user's watch history to include the latest episodes
     * @param show - the show to update
     * @param user - the user to update
     * @private
     */
    private async updateUserSeen(show: (Media & { episodes: Episode[] }), user: (User & { watched: (Watched & { episode: Episode | null })[] })) {
        if (!user) return false;

        const watched = user.watched.filter(w => w.mediaId === show.id);
        const seenMedia = await this.prisma.seenMedia.findUnique({
            where: {
                seenByUser: {
                    userId: user.userId,
                    mediaId: show.id
                }
            }
        });
        if (watched.length === 0 || show.episodes.length === 0) return false;

        const lastSeen = user.watched[0];
        const episodes = this.sortArray(show.episodes, ['seasonId', 'episode'], ['desc', 'desc']);
        const watchedEpisodes = this.sortArray(watched.map(e => e.episode as Episode), ['seasonId', 'episode'], ['desc', 'desc']);

        const lastWatched = watchedEpisodes[0];
        const lastEpisode = episodes[0];

        if (lastWatched.id === lastEpisode.id) return false;

        const lastEpisodeIndex = episodes.findIndex(e => e.id === lastWatched.id);
        const nextEpisode = episodes[lastEpisodeIndex + 1] || null;

        if (!nextEpisode) return false;

        await this.prisma.watched.upsert({
            where: {seenByUser: {userId: user.userId, videoId: nextEpisode.videoId}},
            create: {
                userId: user.userId,
                mediaId: show.id,
                videoId: nextEpisode.videoId,
                position: 0,
                episodeId: nextEpisode.id,
                updated: lastSeen.updated,
                created: lastSeen.updated,
            },
            update: {
                position: 0,
                episodeId: nextEpisode.id,
                updated: lastSeen.updated,
            }
        });

        if (seenMedia)
            await this.prisma.seenMedia.delete({
                where: {seenByUser: {userId: user.userId, mediaId: show.id}}
            });

        return true;
    }
}
