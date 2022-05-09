import {MediaType, Role} from "@prisma/client";
import {drive_v3} from "googleapis";
import {SpringMedia} from "./media";
import {Scanner} from "./scanner";
import Magnet from "./deluge";
import {tmdbMedia} from "./tmdb";
import {WatchHistory} from "./playBack";

export type MedForMod = Pick<SpringMedia, 'name' | 'poster' | 'backdrop' | 'logo' | 'type' | 'tmdbId'> & {
    file?: drive_v3.Schema$File;
    mediaId: number;
    year: number;
    stateType: 'MODIFY' | 'ADD' | 'NONE';
    suggestions: { name: string, tmdbId: number, year: number }[];
}

export type UpdateSearch = Pick<SpringMedia, 'name' | 'poster' | 'backdrop' | 'logo' | 'type' | 'tmdbId' | 'id' | 'overview'>

export interface GetContentSearch {
    libraryName: string | null;
    type: 'PERSON' | 'MOVIE' | 'SHOW';
    overview: string;
    backdrop: string | null;
    id: number;
    popularity: number;
    drift: number;
    name: string;
    download: boolean;
}

export interface PlaybackSettings {
    defaultLang: string;
    autoplay: boolean;
    inform: boolean;
}

export interface EpisodeModSettings {
    showId: number;
    seasonId: number;
    episodeId: number;
    episode: number;
    file?: drive_v3.Schema$File;
}

export interface FrontEpisodes {
    showId: number;
    tmdbId: number;
    seasons: {
        seasonId: number;
        episodes: (EpisodeModSettings & { backdrop: string, name: string, overview: string, found: boolean })[];
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

export interface WatchHistoryResult {
    pages: number;
    page: number;
    results: WatchHistory[];
}

export interface MyList {
    overview: string;
    backdrop: string;
    name: string;
    timeStamp: string;
    logo: string | null;
    id: number;
    location: string;
}

export class Modify extends Scanner {
    private readonly deluge: Magnet;

    constructor() {
        super();
        this.deluge = new Magnet();
    }

    /**
     * @desc modify a user's playback details
     * @param userId - userId of the user
     * @param settings - settings to be modified
     */
    public async modifyUserPlaybackSettings(userId: string, settings: PlaybackSettings) {
        const data = this.prisma.user.update({
            where: {userId},
            data: {...settings}
        })

        return !!data;
    }

    /**
     * @desc Gets the list of the user's watched media
     * @param userId - The user's id
     * @param page - The page to get
     * @param limit - The limit of results per page
     */
    public async getWatchHistory(userId: string, page: number, limit: number): Promise<WatchHistoryResult> {
        const dataCount = await this.prisma.watched.count({
            where: {userId, position: {gt: 0}}
        });

        const pages = Math.ceil(dataCount / limit);
        if (page > pages)
            return {pages, page, results: []};

        const watched = await this.prisma.watched.findMany({
            where: {userId, position: {gt: 0}},
            include: {media: true, episode: true},
            orderBy: {updated: 'desc'},
            skip: (page - 1) * limit,
            take: limit
        });

        const results = watched.map(e => {
            let name = e.media.name;
            let location = '/watch?mediaId=' + e.media.id;
            if (e.episode) {
                name = /^Episode \d+/i.test(e.episode.name || 'Episode') ? `${e.media.name}: S${e.episode.seasonId}, E${e.episode.episode}` : `S${e.episode.seasonId}, E${e.episode.episode}: ${e.episode.name}`;
                location = `/watch?episodeId=${e.episode.id}`;
            }
            return {
                name, backdrop: e.episode?.backdrop || e.media.backdrop,
                position: e.position > 939 ? 100: e.position / 10,
                watchedId: e.id, timeStamp: this.compareDates(e.updated),
                overview: e.episode?.overview || e.media.overview,
                location
            }
        })
        return {pages, page, results};
    }

    /**
     * @desc get the list of all media in user's list
     * @param userId - user identifier
     * @param page - page to get
     * @param limit - limit of results per page
     */
    public async getMyList(userId: string, page: number, limit: number): Promise<{results: MyList[], pages: number, page: number}> {
        const total = await this.prisma.listItem.count({where: {userId}});
        const pages = Math.ceil(total / limit);

        if (page > pages)
            return {results: [], pages, page};

        const myList = await this.prisma.listItem.findMany({
            where: {userId},
            include: {media: true},
            orderBy: {updated: 'desc'},
            skip: (page - 1) * limit,
            take: limit
        });

        const data: MyList[] = myList.map(item => {
            let list = item.media;
            return {
                overview: list.overview,
                backdrop: list.backdrop,
                name: list.name,
                timeStamp: this.compareDates(item.updated),
                logo: list.logo,
                location: '/watch?mediaId=' + list.id,
                id: list.id
            }
        });

        return {results: data, pages, page};
    }

    /**
     * @desc gets the user's playback settings
     * @param userId - userId of the user
     */
    public async getUserPlaybackSettings(userId: string): Promise<PlaybackSettings | null> {
        return await this.prisma.user.findUnique({
            where: {userId},
            select: {
                defaultLang: true,
                autoplay: true,
                inform: true
            }
        });
    }

    /**
     * @desc modify a media entry in the database
     * @param userId - the user modifying the media
     * @param modMedia - the media to be modified
     */
    public async modifyMedia(userId: string, modMedia: MedForMod & { location: string }) {
        if (await this.userIsAdmin(userId)) {
            const {tmdbId, type, name, poster, backdrop, logo, year, mediaId} = modMedia;
            const data = await this.buildMediaObj({backdrop, logo, poster}, {tmdbId, year, name}, type);

            if (data) {
                const {mediaData, castCrew} = data;
                const media = modMedia.stateType === 'MODIFY' ? await this.prisma.media.update({
                    where: {id: mediaId},
                    data: {...mediaData}
                }) : await this.prisma.media.create({
                    data: {...mediaData, created: new Date(), updated: new Date()}
                });

                if (media) {
                    const med = await this.prisma.media.findUnique({
                        where: {id: media.id},
                        include: {folder: true, videos: true}
                    });

                    if (med?.type === MediaType.SHOW)
                        await this.prisma.folder.upsert({
                            where: {showId: med.id},
                            create: {
                                location: modMedia.location,
                                showId: med.id,
                            },
                            update: {
                                location: modMedia.location,
                            }
                        });

                    else if (med?.type === MediaType.MOVIE) {
                        await this.prisma.video.deleteMany({
                            where: {mediaId: med.id}
                        });

                        await this.prisma.video.upsert({
                            where: {location: modMedia.location},
                            create: {
                                location: modMedia.location,
                                mediaId: med.id,
                            },
                            update: {
                                location: modMedia.location,
                            }
                        });
                    }

                    await this.prisma.castCrew.deleteMany({
                        where: {mediaId}
                    });
                    await this.prisma.castCrew.createMany({data: castCrew.map(item => {
                            return {
                                ...item,
                                mediaId: media.id
                            }
                        })});

                    await this.scanShow(media.id, false , true);
                    const videos = await this.prisma.video.findMany({
                        where: {mediaId: media.id},
                        include: {media: true, episode: true}
                    });
                    await this.getSubs(videos);

                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @desc gets the media file information for a given media id
     * @param userId - the user requesting the media
     * @param mediaId - the id of the media
     */
    public async getMediaForMod(userId: string, mediaId: number): Promise<MedForMod | null> {
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
     * @desc modify an episode in the database
     * @param userId - the user modifying the episode
     * @param episode - the episode to be modified
     */
    public async modifyEpisode(userId: string, episode: EpisodeModSettings) {
        if (await this.userIsAdmin(userId)) {
            const data = await this.prisma.episode.update({
                where: {id: episode.episodeId},
                data: {
                    episode: episode.episode,
                    seasonId: episode.seasonId,
                }
            });

            const mod = await this.prisma.video.findFirst({
                where: {episode: {id: episode.episodeId}},
                include: {media: true, episode: true}
            });

            if (mod)
                await this.getSubs([mod]);

            return !!data;
        }

        return false;
    }

    /**
     * @desc checks if a media exists in the database
     * @param tmdbId - the tmdb id of the media
     * @param type - the type of media
     */
    public async checkIfMediaExists(tmdbId: number, type: MediaType): Promise<{ name: string, location: string } | null> {
        const media = await this.prisma.media.findFirst({where: {tmdbId, type}, include: {folder: true, videos: true}});
        return media ? {
            name: media.name,
            location: media.folder ? media.folder.location : media.videos[0].location
        } : null;
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
            where: {AND: [{tmdbId: {in: mediaIds}}, {type}]},
            include: {folder: true, videos: true}
        });

        const intersection = media.filter(m => mediaDBs.find(db => db.tmdbId === m.id));
        const excluded = media.filter(m => !intersection.find(i => i.id === m.id));
        const mediaToAdd: FrontMediaSearch[] = excluded.map(m => ({
            drift: query.Levenshtein(m.name || m.title || ''),
            tmdbId: m.id, name: m.name || m.title || '', inLibrary: false, libraryName: null,
            year: new Date(m.release_date || m.first_air_date).getFullYear(),
            libraryLocation: null
        }));

        const existsInDb: FrontMediaSearch[] = intersection.map(m => {
            const media = mediaDBs.find(db => db.tmdbId === m.id);
            return {
                drift: query.Levenshtein(m.name || m.title || ''),
                tmdbId: m.id, name: m.name || m.title || '', inLibrary: true, libraryName: media?.name || null,
                year: new Date(m.release_date || m.first_air_date).getFullYear(),
                libraryLocation: media?.folder?.location || media?.videos[0].location || null
            }
        });

        return this.sortArray(mediaToAdd.concat(existsInDb), 'drift', 'asc');
    }

    /**
     * @desc gets the list of all episodes for a media in the database
     * @param mediaId - the id of the media
     * @param userId - the user requesting the episodes
     */
    public async getEpisodes(mediaId: number, userId: string) {
        if (await this.userIsAdmin(userId)) {
            const media = await this.prisma.media.findUnique({
                where: {id: mediaId},
                include: {episodes: {include: {video: true}}, folder: true}
            });
            if (media && media.folder) {
                const seasons = this.uniqueId(media.episodes, 'seasonId');
                const show: FrontEpisodes = {
                    showId: media.id,
                    tmdbId: media.tmdbId,
                    seasons: [],
                }
                const files = await this.drive?.recursiveReadFolder(media.folder.location) || [];
                const episodes: EpisodeModSettings[] = media.episodes.map(e => {
                    const file = files.find(f => f.id === e.video.location);
                    return {file, episodeId: e.id, seasonId: e.seasonId, showId: media.id, episode: e.episode};
                });

                for await (const season of seasons) {
                    const tmdbSeason = await this.tmdb?.getSeason(media.tmdbId, season.seasonId);
                    if (tmdbSeason) {
                        const episodesInSeason = episodes.filter(e => e.seasonId === season.seasonId);
                        const data = {
                            seasonId: season.seasonId,
                            episodes: episodesInSeason.map(e => {
                                const tmdbEpisode = tmdbSeason.episodes.find(ep => ep.episode_number === e.episode);
                                const backdrop = tmdbEpisode?.still_path ? `https://image.tmdb.org/t/p/original${tmdbEpisode.still_path}` : media.backdrop;
                                const name = tmdbEpisode?.name ? `S${e.seasonId}: E${e.episode}: ` + tmdbEpisode.name : media.name + `, S${e.seasonId}: E${e.episode}`;
                                const overview = tmdbEpisode?.overview || media.overview;
                                return {...e, backdrop, name, overview, found: !!tmdbEpisode};
                            })
                        };

                        show.seasons.push(data);

                    } else
                        show.seasons.push({
                            seasonId: season.seasonId,
                            episodes: episodes.filter(e => e.seasonId === season.seasonId).map(e => {
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

        return null;
    }

    /**
     * @desc get the subtitles for every video of a media in the database
     * @param userId - the user requesting the subtitles
     * @param mediaId - the id of the media
     */
    public async scanSubs(userId: string, mediaId: number) {
        if (await this.userIsAdmin(userId)) {
            const videos = await this.prisma.video.findMany({
                where: {mediaId},
                include: {episode: true, media: true},
            });

            await this.getSubs(videos);
            return true;
        }

        return false;
    }

    /**
     * @desc get the manage sections for the admin
     * @param userId - the user requesting the sections
     */
    public async getManage(userId: string) {
        let manage = ['library', 'manage picks', 'manage keys', 'manage users', 'system config'];

        if (await this.userIsAdmin(userId))
            await this.deluge.delugeActive() ? manage.splice(2, 0, 'get contents') : manage;

        return manage;
    }

    /**
     * @desc confirms the user is an admin
     * @param userId - the user identifier
     * @private
     */
    public async userIsAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {userId}
        });

        return user?.role === Role.ADMIN;
    }

    /**
     * @desc get all contents not in the database
     * @param userId - the user requesting the contents
     */
    public async getUnScanned(userId: string) {
        let unScanned: MedForMod[] = [];
        if (await this.userIsAdmin(userId)) {
            const videos = await this.prisma.video.findMany();
            const folder = await this.prisma.folder.findMany();

            let movies = await this.drive?.recursiveReadFolder(this.moviesLocation || '') || [];
            movies = movies.filter(file => videos.every(video => video.location !== file.id));

            let tvShows = await this.drive?.readFolder(this.showsLocation || '') || [];
            tvShows = tvShows.filter(file => folder.every(show => show.location !== file.id));

            for await (const movie of movies) {
                const {backup, results} = await this.scanMediaHelper(movie, MediaType.MOVIE);
                const suggestions = backup.length ? backup : results;
                unScanned.push({
                    logo: '', mediaId: 0, stateType: 'ADD',
                    name: suggestions.length ? suggestions[0].name : movie.name!,
                    file: movie, type: MediaType.MOVIE, suggestions, poster: '',
                    year: suggestions.length ? suggestions[0].year : new Date().getFullYear(),
                    backdrop: suggestions.length ? suggestions[0].backdrop || '' : '',
                    tmdbId: suggestions.length ? suggestions[0].tmdbId || 0 : 0,
                })
            }

            for await (const show of tvShows) {
                const {backup, results} = await this.scanMediaHelper(show, MediaType.SHOW);
                const suggestions = backup.length ? backup : results;
                unScanned.push({
                    logo: '', mediaId: 0, stateType: 'ADD',
                    name: suggestions.length ? suggestions[0].name : show.name!,
                    file: show, type: MediaType.SHOW, suggestions, poster: '',
                    year: suggestions.length ? suggestions[0].year : new Date().getFullYear(),
                    backdrop: suggestions.length ? suggestions[0].backdrop || '' : '',
                    tmdbId: suggestions.length ? suggestions[0].tmdbId || 0 : 0,
                })
            }

            return this.sortArray(unScanned, 'name', 'asc');
        }

        return unScanned;
    }

    /**
     * @desc search contents in the database that matches the search term
     * @param value - the search term
     */
    public async searchLib(value: string): Promise<UpdateSearch[]> {
        return await this.prisma.media.findMany({
            select: {
                name: true,
                poster: true,
                backdrop: true,
                logo: true,
                type: true,
                tmdbId: true,
                id: true,
                overview: true
            },
            where: {
                name: {contains: value, mode: 'insensitive'}
            }, orderBy: {name: 'asc'},
        })
    }

    /**
     * @desc searches tmdb for a query: Frontend
     * @param value - the search term
     */
    public async totalSearch(value: string) {
        const media = await this.prisma.media.findMany();
        const movies = await this.tmdb?.searchMedia(MediaType.MOVIE, value) || [];
        const shows = await this.tmdb?.searchMedia(MediaType.SHOW, value) || [];
        const people = await this.tmdb?.searchPerson(value) || [];

        const peopleData: GetContentSearch[] = people.filter(item => item.profile_path !== null).map(e => {
            return {
                download: false,
                id: e.id, name: e.name, type: 'PERSON',
                logo: e.profile_path, tmdbId: e.id, popularity: e.popularity,
                backdrop: e.profile_path ? `https://image.tmdb.org/t/p/original${e.profile_path}` : null,
                libraryName: null, drift: e.name.Levenshtein(value),
                overview: e.known_for.map((entry, i) => `${entry.name ? entry.name : entry.title}${i === e.known_for.length - 2 ? ' and ' : ', '}`).join('').replace(/, $/, '.')
            }
        });

        const mediaItems: GetContentSearch[] = movies.concat(shows).filter(e => e.backdrop_path && e.overview).map(e => {
            const med = media.find(item => item.tmdbId === e.id);
            return {
                download: false, libraryName: med?.name || null,
                popularity: e.popularity, name: e.name ? e.name : e.title || '',
                drift: value.Levenshtein(e.name ? e.name : e.title || ''),
                type: e.name ? 'SHOW' : 'MOVIE', id: e.id, overview: e.overview || '',
                backdrop: e.backdrop_path ? "https://image.tmdb.org/t/p/original" + e.backdrop_path : null,
            }
        });

        return this.sortArray([...peopleData, ...mediaItems], ['drift', 'popularity'], ['asc', 'desc']);
    }

    /**
     * @desc searches tmdb for a recommendation: Frontend
     * @param tmdbId - the tmdb id to get recommendations for
     * @param type - the type of media to get recommendations for
     */
    public async getRecommended(tmdbId: number, type: 'PERSON' | 'MOVIE' | 'SHOW') {
        if (type !== 'PERSON') {
            const tmdbMedia = await this.tmdb?.getMedia(tmdbId, type) || null;
            const recommendations = await this.tmdb?.getRecommendations(tmdbId, type, 4) || [];
            const recIds = recommendations.map(e => e.id);
            let collection: tmdbMedia[] = []
            const media = await this.prisma.media.findMany({
                where: {AND: [{tmdbId: {in: recIds}}, {type}]},
                select: {tmdbId: true, name: true}
            });

            if (tmdbMedia) {
                if (tmdbMedia.belongs_to_collection) {
                    const cols = await this.tmdb?.getMovieCollection(tmdbMedia.belongs_to_collection.id) || null;
                    collection = cols?.parts || [];
                }

                const present = media.find(e => e.tmdbId === tmdbId);
                const defMedia: GetContentSearch = {
                    download: true, drift: 0, id: tmdbMedia.id,
                    popularity: tmdbMedia.popularity, overview: tmdbMedia.overview || '',
                    name: tmdbMedia.name || tmdbMedia.title || '', type, libraryName: present?.name || null,
                    backdrop: tmdbMedia.backdrop_path ? "https://image.tmdb.org/t/p/original" + tmdbMedia.backdrop_path : null,
                }

                const res = collection.concat(this.sortArray(recommendations, 'popularity', 'desc')).map(e => {
                    const med = media.find(item => item.tmdbId === e.id);
                    return {
                        download: true, libraryName: med?.name || null,
                        popularity: e.popularity, name: e.name ? e.name : e.title || '',
                        drift: 0, type, id: e.id, overview: e.overview || '',
                        backdrop: e.backdrop_path ? "https://image.tmdb.org/t/p/original" + e.backdrop_path : null,
                    }
                }) as GetContentSearch[];
                return this.uniqueId([defMedia, ...res], ['type', 'id']);
            }

        } else {
            const data = await this.tmdb?.getPersonMedia(tmdbId) || null;
            if (data) {
                const dataMovId = data.movies.map(e => e.id);
                const dataShId = data.tv.map(e => e.id);

                const medMov = await this.prisma.media.findMany({
                    where: {AND: [{tmdbId: {in: dataMovId}}, {type: MediaType.MOVIE}]},
                    select: {tmdbId: true, name: true, type: true}
                });

                const medSh = await this.prisma.media.findMany({
                    where: {AND: [{tmdbId: {in: dataShId}}, {type: MediaType.SHOW}]},
                    select: {tmdbId: true, name: true, type: true}
                });

                const meds = medMov.concat(medSh);

                return this.uniqueId(this.sortArray(data.movies.concat(data.tv), 'popularity', 'desc').map(e => {
                    const type = e.name ? MediaType.SHOW : MediaType.MOVIE;
                    const med = meds.find(item => item.tmdbId === e.id && item.type === type);
                    return {
                        download: true, libraryName: med?.name || null,
                        popularity: e.popularity, name: e.name ? e.name : e.title || '',
                        drift: 0, type: type, id: e.id, overview: e.overview || '',
                        backdrop: e.backdrop_path ? "https://image.tmdb.org/t/p/original" + e.backdrop_path : null,
                    }
                }), ['type', 'id']) as GetContentSearch[];
            }
        }

        return [];
    }

    /**
     * @desc get new contents to add to the database
     * @param userId - the user requesting the contents
     */
    public async getNewContent(userId: string) {
        if (await this.userIsAdmin(userId)) {
            const dbase = await this.prisma.media.findMany();
            const trending = await this.tmdb?.getTrending(4) || {movies: [], shows: []};
            const popular = await this.tmdb?.getPopular(4) || {movies: [], shows: []};
            const topRated = await this.tmdb?.getTopRated(4) || {movies: [], shows: []};

            const moviesToDownload = this.uniqueId(trending.movies.concat(popular.movies, topRated.movies), 'id');
            const showsToDownload = this.uniqueId(trending.shows.concat(popular.shows, topRated.shows), 'id');

            const sortedMovies = this.sortArray(moviesToDownload, 'popularity', 'desc');
            const sortedShows = this.sortArray(showsToDownload, 'popularity', 'desc');

            const missingMovies = sortedMovies.filter(movie => !dbase.find(e => e.tmdbId === movie.id && e.type === MediaType.MOVIE));
            const missingShows = sortedShows.filter(show => !dbase.find(e => e.tmdbId === show.id && e.type === MediaType.SHOW));

            const promises: any[] = missingMovies.map(e => this.deluge.addMagnet(e.id, MediaType.MOVIE)).concat(missingShows.map(e => this.deluge.addMagnet(e.id, MediaType.SHOW)));
            await Promise.all(promises);
            await this.deluge.parseFeed();
        }
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

            const promises = missingSeason.map(e => this.deluge.addSeasonTorrent(media.tmdbId, e.seasonId)).concat(missingEpisodes.map(e => this.deluge.addSeasonTorrent(media.tmdbId, e.season_number, e.episode_number)));
            await Promise.all(promises);
        }
    }

    /**
     * @desc Finds new episodes and seasons for shows in the database
     * @param userId - the user requesting the contents
     */
    public async getMissingEpisodes(userId: string) {
        if (await this.userIsAdmin(userId)) {
            const shows = await this.prisma.media.findMany({
                where: {type: MediaType.SHOW},
                orderBy: {updated: 'desc'}
            });

            const promises = shows.map(e => this.getMissingEpisodesInShow(e.id));
            await Promise.all(promises);
        }
    }

    /**
     * @desc changes the default subtitle language for a user
     * @param userId - the user requesting the change
     * @param sub - the new subtitle language
     */
    public async modifyUserDefaultSub(userId: string, sub: string) {
        try {
            await this.prisma.user.update({
                where: {userId},
                data: {defaultLang: sub}
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}
