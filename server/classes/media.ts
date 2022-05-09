import {CastCrew, CastType, Episode, Media as Med, MediaType, Prisma} from "@prisma/client";
import {CompType} from "./tmdb";
import {Base} from "./auth";

export interface SpringMedia extends Omit<Med, "created" | "updated" | "production" | "collection" | "release"> {
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

export interface GridBlockInterface {
    page: number;
    pages: number;
    results: Pick<SpringMedia, 'id' | 'type' | 'backdrop' | 'logo' | 'name'>[];
}

type GridList = Pick<SpringMedia, 'id' | 'type' | 'name'>;

export type gridOpt = "list" | "grid";

export type SearchPicker<T> = T extends "list" ? searchGrid[] : T extends "grid" ? searchBlock[] : never;

export interface searchGrid extends GridList {
    diff: number;
}

export interface searchBlock extends Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'> {
    diff: number;
}

type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type WithRequired<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<T, K>

type RequiredNotNull<T> = {
    [P in keyof T]: NonNullable<T[P]>
}

type Ensure<T, K extends keyof T> = T & RequiredNotNull<Pick<T, K>>

export interface PersonInterface {
    id: number;
    name: string;
    photo: string;
    overview: string;
    images: string[];
    castMedia: Pick<SpringMedia, 'id' | 'name' | 'type' | 'poster' | 'background'>[];
    producedMedia: Pick<SpringMedia, 'id' | 'name' | 'type' | 'poster' | 'background'>[];
    writtenMedia: Pick<SpringMedia, 'id' | 'name' | 'type' | 'poster' | 'background'>[];
    directedMedia: Pick<SpringMedia, 'id' | 'name' | 'type' | 'poster' | 'background'>[];
}

export interface ProductionCompanyInterface {
    name: string,
    logo: string,
    images: string[],
    type: CompType,
    id: string,
    movies: Pick<SpringMedia, 'id' | 'type' | 'name' | 'background' | 'poster'>[],
    shows: Pick<SpringMedia, 'id' | 'type' | 'name' | 'background' | 'poster'>[]
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

export interface SpringMedUserSpecifics {
    myList: boolean;
    seen: boolean;
    rating: string;
    favorite: boolean;
    download: boolean;
    canEdit: boolean;
}

export interface FramesCollections {
    id: number;
    name: string;
    poster: string;
    background: string;
    images: string[];
    media: Pick<SpringMedia, 'id' | 'type' | 'name' | 'poster' | 'background'>[];
}

export default class Media extends Base {

    /**
     * @desc finds a media item by their name and for multiple copies it returns the most recent version
     * @param request - the request string sent from the client
     * @param type - the type of media to search for
     */
    public async findMedia(request: string, type: MediaType): Promise<number> {
        const response = await this.prisma.media.findMany({where: {type, name: {contains: request}}});
        let data = response.map(item => {
            const year = item.release?.getFullYear();
            const drift = item.name.Levenshtein(request);
            return {...item, drift, year};
        });
        data = this.sortArray(data, ['drift', 'year'], ['asc', 'desc']);
        return data.length ? data[0].id : -1;
    }

    /**
     * @desc finds a person by their name and for multiple copies it returns the most recent version
     * @param request - the request string sent from the client
     */
    public async findPerson(request: string): Promise<number> {
        let res = await this.tmdb?.searchPerson(request) || [];
        let people = this.sortArray(res.map(e => {
            const drift = e.name.Levenshtein(request);
            return {...e, drift};
        }), 'drift', 'asc');

        return people.length ? people[0].id : -1;
    }

    /**
     * @desc finds a collection by their name
     * @param request - the request string sent from the client
     */
    public async findCollection(request: string): Promise<number> {
        const media = await this.prisma.media.findMany({
            where: {
                collection: {
                    path: ['name'], string_contains: request
                }
            }
        });

        let data = media.map(e => e.collection as { name: string, id: number }).filter(e => e)
            .map(e => {
                const drift = e.name.Levenshtein(request);
                return {...e, drift};
            });

        data = this.sortArray(data, 'drift', 'asc');
        return data.length ? data[0].id : -1;
    }

    /**
     * @desc finds a production company by their name
     * @param request - the request string sent from the client
     */
    public async findProductionCompany(request: string): Promise<number> {
        const media = (await this.prisma.media.findMany()).map(e => e.production as { name: string, id: number }[]).flat().filter(e => e)
            .map(e => {
                const drift = e.name.Levenshtein(request);
                return {...e, drift};
            });

        const data = this.sortArray(media, 'drift', 'asc');
        return data.length ? data[0].id : -1;
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
                                    contains: searchValue,
                                    mode: "insensitive"
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
                        diff: searchValue.Levenshtein(e),
                    }
                }), 'diff', 'asc');
                return {...e, diff: data[0].diff}
            }), 'diff', 'asc') as SearchPicker<T>;
        }
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

            let collectionIds: any[] = [];
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

            if (collection) {
                const col = collection as any as { id: number };
                collectionIds = await this.prisma.media.findMany({
                    where: {
                        AND: [{
                            collection: {
                                path: ['id'], equals: col.id
                            }
                        }, {NOT: {id: id}}]
                    }, select: {
                        id: true, type: true, name: true, background: true, poster: true,
                    }, orderBy: {release: 'asc'}
                });
            }

            const season = this.sortArray(episodes, 'seasonId', 'asc');
            const sections = season.length ? season.length === 1 && season[0].seasonId === 1 ? ['Episodes'] : ['Seasons'] : [];

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

            const recon = await this.tmdb?.getRecommendations(media.tmdbId, media.type, 2) || [];
            const tmdbIds = recon.map(e => e.id).filter(e => e !== media.tmdbId);
            let recommendations = await this.prisma.media.findMany({
                where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]},
                select: {id: true, poster: true, name: true, type: true, background: true}
            });

            sections.push(recommendations.length ? 'More like this' : 'Surprise me!');
            sections.push('Details');

            recommendations = recommendations.length ? recommendations : this.randomise(await this.prisma.media.findMany({
                select: {
                    id: true, poster: true, name: true, type: true, background: true
                }, where: {type: media.type}
            }), 20, media.id);
            recommendations = this.uniqueId(collectionIds.concat(recommendations), 'id');
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

        const movieRes = this.intersect(movieMedia, trending.movies, MediaType.MOVIE, 'popularity');
        const showRes = this.intersect(showMedia, trending.shows, MediaType.SHOW, 'popularity');
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

        const movieRes = this.intersect(movieMedia, popular.movies, MediaType.MOVIE, 'popularity');
        const showRes = this.intersect(showMedia, popular.shows, MediaType.SHOW, 'popularity');
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

        const movieRes = this.intersect(movieMedia, topRated.movies, MediaType.MOVIE, 'popularity');
        const showRes = this.intersect(showMedia, topRated.shows, MediaType.SHOW, 'popularity');
        return this.sortArray([...movieRes, ...showRes], 'popularity', 'desc');
    }

    /**
     * @desc gets the list of all the genres of the media in the database
     */
    public async getGenres(type?: MediaType): Promise<string[]> {
        let data = type ? await this.prisma.media.findMany({where: {type}, select: {genre: true}}) : await this.prisma.media.findMany({select: {genre: true}});
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
    public async getDecades(type?: MediaType): Promise<string[]> {
        let data = type ? await this.prisma.media.findMany({select: {release: true}, where: {type}}) : await this.prisma.media.findMany({select: {release: true}});
        const years = data.map(item => item.release?.getFullYear() || 0).filter(item => item !== 0);
        const decades = years.map(e => {
            return {decade: `${Math.floor(e / 10) * 10}s`};
        });
        return this.sortArray(this.uniqueId(decades, 'decade'), 'decade', 'asc').map(e => e.decade);
    }

    /**
     * @desc gets the list of all the trending media in the database
     * @param type - the type of media to get
     */
    public async getLibrary(type: MediaType) {
        const trending = (await this.tmdb?.getTrending(2)) || {movies: [], shows: []};
        const movies = trending.movies.map(e => e.id);
        const shows = trending.shows.map(e => e.id);

        const library = type === MediaType.MOVIE ? movies : shows;

        return await this.prisma.media.findMany({
            where: {AND: [{tmdbId: {in: library}}, {type: type}]}, select: {
                name: true, id: true, type: true,
            }
        });
    }

    /**
     * @desc searches for movies in a specific decade by pages of 100
     * @param decade - the decade to query the database for
     * @param page - the page of results to query
     */
    public async searchDecade(decade: number, page: number): Promise<GridBlockInterface> {
        const decadeStart = new Date(decade, 0, 1);
        const decadeEnd = new Date(decade + 10, 0, 1);

        const data = await this.prisma.media.findMany({
            where: {
                AND: [{release: {gt: decadeStart}}, {release: {lte: decadeEnd}}]
            }, skip: (page - 1) * 100, take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}], select: {
                id: true, name: true, type: true, backdrop: true, logo: true,
            }
        });

        const dataCount = await this.prisma.media.count({
            where: {
                AND: [{release: {gt: decadeStart}}, {release: {lte: decadeEnd}}]
            }
        });

        const pages = Math.ceil(dataCount / 100);
        return {
            results: data, pages: pages, page: page
        };
    }

    /**
     * @desc searches for movies in a specific genre by pages of 100
     * @param genre - the decade to query the database for
     * @param page - the page of results to query
     */
    public async searchGenre(genre: string, page: number): Promise<GridBlockInterface> {
        const data = await this.prisma.media.findMany({
            where: {
                genre: {contains: genre, mode: 'insensitive'}
            }, skip: (page - 1) * 100, take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}], select: {
                id: true, name: true, type: true, backdrop: true, logo: true,
            }
        });

        const dataCount = await this.prisma.media.count({
            where: {
                genre: {contains: genre, mode: 'insensitive'}
            }
        });

        const pages = Math.ceil(dataCount / 100);
        return {
            results: data, pages: pages, page: page
        };
    }

    /**
     * @desc gets the list of all the media of a specific type in the database
     * @param type - the type of media to query the database for
     * @param page - the page of results to query
     */
    public async searchLibrary(type: MediaType, page: number): Promise<GridBlockInterface> {
        const trending = await this.tmdb?.getTrendingMedia(type, 3);
        const data = await this.prisma.media.findMany({
            where: {type}, orderBy: [{release: 'desc'}, {vote_average: 'desc'}], select: {
                id: true, name: true, type: true, backdrop: true, tmdbId: true, logo: true,
            }
        });

        let response = data.filter(item => trending?.some(e => e.id === item.tmdbId));
        response = this.uniqueId(response.concat(data), 'id');
        response = response.slice((page - 1) * 100, page * 100);

        const dataCount = await this.prisma.media.count({where: {type}});

        const pages = Math.ceil(dataCount / 100);
        return {
            results: response, pages: pages, page: page
        };
    }

    /**
     * @desc gets the list of all the trending media collections in the database
     */
    public async getCollections() {
        const data = await this.getTrending(3);
        return data.filter(item => item.type === MediaType.MOVIE && item.collection).map(e => e.collection) as Pick<FramesCollections, 'id' | 'name' | 'poster'>[];
    }

    /**
     * @desc gets the list of all the collections in the database
     * @param page - the page of results to query
     */
    public async searchCollections(page: number) {
        const info: { collection: any }[] = await this.prisma.media.findMany({
            orderBy: [{release: 'desc'}, {vote_average: 'desc'}],
        });
        let res: { id: number, name: string, poster: string }[] = info.filter(item => item.collection !== null).map(item => item.collection);

        res = this.sortArray(this.uniqueId(res, 'id'), 'name', 'asc');
        const dataCount = res.length;
        const pages = Math.ceil(dataCount / 100);

        const data = res.slice((page - 1) * 100, page * 100);
        return {
            results: data, pages: pages, page: page
        };
    }

    /**
     * @desc gets the details of a specific person in the castCrew table of the database
     * @param id - the id of the person to query the database for
     */
    public async getPerson(id: number): Promise<PersonInterface | null> {
        const person = await this.tmdb?.getPerson(id);
        if (person) {
            const data = await this.prisma.castCrew.findMany({
                where: {tmdbId: id}, include: {
                    media: {
                        select: {
                            id: true, name: true, type: true, poster: true, background: true, release: true
                        }
                    }
                },
            });

            const directed = data.filter(item => item.type === CastType.DIRECTOR);
            const cast = data.filter(item => item.type === CastType.ACTOR);
            const produced = data.filter(item => item.type === CastType.PRODUCER);
            const wrote = data.filter(item => item.type === CastType.WRITER);

            const directedMedia = this.sortArray(this.uniqueId(directed.map(item => item.media), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const castMedia = this.sortArray(this.uniqueId(cast.map(item => item.media), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const producedMedia = this.sortArray(this.uniqueId(produced.map(item => item.media), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const writtenMedia = this.sortArray(this.uniqueId(wrote.map(item => item.media), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            return {
                images: data.map(item => item.media).map(item => item.poster),
                id,
                name: person.name || '',
                directedMedia,
                castMedia,
                producedMedia,
                writtenMedia,
                overview: person.biography,
                photo: 'https://image.tmdb.org/t/p/original' + person.profile_path
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
                        name, backdrop, logo, type, videoId,
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
                name, backdrop, logo, type,
                episodeBackdrop: undefined,
                episodeName: undefined,
                overview, videoId,
                mediaId: video.media.id,
                location: '/watch?mediaId=' + video.media.id,
            }

            return res;
        }

        return null;
    }

    /**
     * @desc gets the details of a specific collection in the database
     * @param id - the id of the collection to query the database for
     */
    public async getCollection(id: number): Promise<FramesCollections | null> {
        const collection = await this.prisma.media.findMany({
            where: {
                collection: {
                    path: ['id'], equals: id
                }
            }, select: {
                id: true, type: true, name: true, background: true, poster: true,
            }, orderBy: {release: 'desc'}
        });
        const tmdbCollection = await this.tmdb?.getMovieCollection(id);
        if (collection.length && tmdbCollection) return {
            id,
            media: collection,
            name: tmdbCollection.name,
            images: this.randomise(collection, collection.length, 0).map(item => item.poster),
            poster: tmdbCollection.poster_path ? 'https://image.tmdb.org/t/p/original' + tmdbCollection.poster_path : '',
            background: tmdbCollection.backdrop_path ? 'https://image.tmdb.org/t/p/original' + tmdbCollection.backdrop_path : '',
        };

        return null;
    }

    /**
     * @desc gets the details of a specific production company in the database
     * @param prodCompany - the id of the production company to query
     */
    public async getProductionCompany(prodCompany: string): Promise<ProductionCompanyInterface | null> {
        const media: Pick<SpringMedia, 'id' | 'type' | 'name' | 'background' | 'poster'>[] = await this.prisma.$queryRaw(Prisma.sql`SELECT id, name, type, poster, background FROM "Media",jsonb_array_elements(production) with ordinality arr(production) WHERE arr.production->>'id' = ${prodCompany} ORDER BY name asc;`)

        const confirm = prodCompany.charAt(0) === "s";
        const id = prodCompany.replace(/[ms]/, '');
        const type = confirm ? CompType.NETWORK : CompType.COMPANY;
        const company = await this.tmdb?.getProductionCompany(+id, type);

        if (company) {
            const movies = media.filter(item => item.type === MediaType.MOVIE);
            const shows = media.filter(item => item.type === MediaType.SHOW);
            const images = media.map(e => e.poster);

            return {
                images,
                name: company.name,
                type,
                id: prodCompany,
                movies,
                shows,
                logo: 'https://image.tmdb.org/t/p/original' + company.logo_path,
            }
        }

        return null;
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
     * @desc gets the recently added media in the database
     * @param limit - the number of media to return
     */
    public async getRecentlyAdded(limit: number) {
        return await this.prisma.media.findMany({
            orderBy: [{updated: 'desc'}], take: limit
        })
    }

    /**
     * @desc checks if a user has seen all videos belonging to a media
     * @param mediaId - the id of the media
     * @param userId - the id of the user
     */
    public async checkIfSeen(mediaId: number, userId: string) {
        const media = await this.prisma.media.findUnique({where: {id: mediaId}, include: {videos: true}});
        const watched = await this.prisma.watched.findMany({where: {userId, mediaId}});
        const finished = watched.filter(e => e.times > 0);
        return media?.videos.length === finished.length && finished.length > 0;
    }

    /**
     * @desc gets basic user recommendations from the database for a specific user
     * @param userId - the id of the user to query the database for
     */
    public async getRecommended(userId: string) {
        const value = this.weightedRandom({
            'media': 0.35, 'basic': 0.25, 'genre': 0.20, 'name': 0.13, 'char': 0.07,
        });

        switch (value) {
            case 'media':
                return await this.getMediaRecommend(userId);
            case 'basic':
                return await this.getBasicRecommend(userId);
            case 'genre':
                return await this.getGenreRecommend(userId);
            case 'name':
                return await this.getCastNameRecommend(userId);
            case 'char':
                return await this.getCastCharRecommend(userId);
        }

        return null;
    }

    /**
     * @desc gets media recommendations from the database for a specific user
     * @param userId - the id of the user to query the database for
     */
    private async getBasicRecommend(userId: string) {
        const user = await this.prisma.user.findFirst({where: {userId: userId}});
        if (user) {
            const history = await this.prisma.view.findMany({
                where: {user: {id: user.id}}, select: {video: {include: {media: true}}}
            });

            if (history.length > 0) {
                const mediaIds = history.map(item => item.video.media.id);
                const media = await this.prisma.media.findMany({
                    where: {id: {in: mediaIds}}, select: {id: true, genre: true}
                });

                if (media.length > 0) {
                    const recommendations = await this.prisma.media.findMany({
                        where: {
                            NOT: {
                                id: {in: mediaIds},
                            }, type: {
                                in: [MediaType.MOVIE, MediaType.SHOW]
                            }, genre: {
                                in: media.map(item => item.genre)
                            }
                        },
                        select: {id: true, name: true, poster: true, background: true, vote_average: true, type: true}
                    });

                    mediaIds.map(e => {
                        const index = recommendations.findIndex(item => item.id === e);
                        if (index > -1) recommendations.splice(index, 1);
                    });

                    const display = ['check these out', 'something new to watch', 'frames suggest', ' you would probably love these', 'nothing else to watch?', 'how about one of these'];
                    return {
                        data: this.sortArray(this.randomise(recommendations, 12, 0), 'vote_average', 'desc'),
                        type: 'BASIC',
                        display: display[Math.floor(Math.random() * display.length)]
                    };
                }
            }
        }

        return {data: [], display: 'none', type: 'basic'};
    }

    /**
     * @desc gets related media based on user activity and the cast's name
     * @param userId - the id of the user to query the database for
     */
    private async getCastNameRecommend(userId: string) {
        const response = await this.baseRecommend(userId);
        if (response) {
            const {seen, ratings, suggestions, watched} = response;
            const seenCastCrews = this.sortArray(this.countAppearances(seen.map(e => e.castCrews.filter(x => x.type === CastType.ACTOR || x.type === CastType.DIRECTOR)), 'count', 'tmdbId'), 'count', 'desc');
            const ratingsCastCrews = this.sortArray(this.countAppearances(ratings.map(e => e.castCrews.filter(x => x.type === CastType.ACTOR || x.type === CastType.DIRECTOR)), 'count', 'tmdbId'), 'count', 'desc');
            const suggestionsCastCrews = this.sortArray(this.countAppearances(suggestions.map(e => e.castCrews.filter(x => x.type === CastType.ACTOR || x.type === CastType.DIRECTOR)), 'count', 'tmdbId'), 'count', 'desc');
            const watchedCastCrews = this.sortArray(this.countAppearances(watched.map(e => e.castCrews.filter(x => x.type === CastType.ACTOR || x.type === CastType.DIRECTOR)), 'count', 'tmdbId'), 'count', 'desc');

            let med = this.countAppearances([seenCastCrews, ratingsCastCrews, suggestionsCastCrews, watchedCastCrews], 'count', 'id');
            const counts = this.sortArray(med, 'count', 'desc');

            if (counts.length > 10) {
                const castCrew = counts[Math.floor(Math.random() * 10)];

                const data = await this.prisma.media.findMany({
                    where: {
                        castCrews: {
                            some: {
                                tmdbId: castCrew.tmdbId
                            }
                        }
                    }, select: {
                        id: true, type: true, poster: true, background: true, name: true
                    }, orderBy: {
                        vote_average: 'desc'
                    }
                });

                return {
                    data: this.randomise(data, 12, 0),
                    display: `see more media ${castCrew.type === CastType.DIRECTOR ? 'directed by' : 'starring'} ${castCrew.name.toLowerCase()}`,
                    type: 'BASIC'
                };
            }
        }

        return {data: [], display: 'none', type: 'basic'};
    }

    /**
     * @desc gets related media based on user activity and the cast's character
     * @param userId - the id of the user to query the database for
     */
    private async getCastCharRecommend(userId: string) {
        const response = await this.baseRecommend(userId);
        if (response) {
            const {seen, ratings, suggestions, watched} = response;
            const seenCastCrews = seen.map(e => e.castCrews.filter(a => a.type === CastType.ACTOR && a.character && !/Self|\(\w+\)|^\w+$/i.test(a.character!)));
            const ratingsCastCrews = ratings.map(e => e.castCrews.filter(a => a.type === CastType.ACTOR && a.character && !/Self|\(\w+\)|^\w+$/i.test(a.character!)));
            const suggestionsCastCrews = suggestions.map(e => e.castCrews.filter(a => a.type === CastType.ACTOR && a.character && !/Self|\(\w+\)|^\w+$/i.test(a.character!)));
            const watchedCastCrews = watched.map(e => e.castCrews.filter(a => a.type === CastType.ACTOR && a.character && !/Self|\(\w+\)|^\w+$/i.test(a.character!)));

            const seenCount = this.countAppearances(seenCastCrews, 'count', "character");
            const ratingsCount = this.countAppearances(ratingsCastCrews, 'count', "character");
            const suggestionsCount = this.countAppearances(suggestionsCastCrews, 'count', "character");
            const watchedCount = this.countAppearances(watchedCastCrews, 'count', "character");

            const med = this.countAppearances([seenCount, ratingsCount, suggestionsCount, watchedCount], 'count', "character");
            const counts = this.sortArray(med, 'count', 'desc');

            if (counts.length > 10) {
                const character = counts[Math.floor(Math.random() * 10)].character;

                const data = await this.prisma.media.findMany({
                    where: {
                        castCrews: {
                            some: {
                                character: {contains: character!, mode: "insensitive"}
                            }
                        }
                    }, select: {
                        id: true, type: true, poster: true, background: true, name: true
                    }, orderBy: {
                        vote_average: 'desc'
                    }
                });

                return {
                    data: this.randomise(data, 12, 0),
                    display: `more media portraying ${character!.toLowerCase()}`,
                    type: 'BASIC'
                };
            }

            return {data: [], display: 'none', type: 'basic'};
        }
    }

    /**
     * @desc gets related media based on user activity and genres
     * @param userId - the id of the user to query the database for
     */
    private async getGenreRecommend(userId: string) {
        const response = await this.baseRecommend(userId);
        if (response) {
            const {seen, ratings, suggestions, watched} = response;

            const counts = this.sortArray(this.countAppearances([seen, ratings, suggestions, watched], 'count', 'genre'), 'count', 'desc');

            if (counts.length > 10) {
                const genre = counts[Math.floor(Math.random() * 10)];
                const split = genre.genre.replace(/[,&]/g, ' ').split(' ');

                let media: { id: number, vote_average: number | null, type: MediaType, poster: string, background: string, name: string }[] = [];

                for (let i = 0; i < split.length; i++) {
                    const data = await this.prisma.media.findMany({
                        where: {
                            genre: {contains: split[i], mode: 'insensitive'}
                        }, select: {
                            id: true, type: true, poster: true, background: true, vote_average: true, name: true
                        }
                    });

                    media = media.concat(data);
                }

                media = this.sortArray(this.uniqueId(media, 'id'), 'vote_average', 'desc');
                const data = this.randomise(media, 12, 0).map(e => {
                    return {
                        id: e.id, type: e.type, poster: e.poster, background: e.background, name: e.name
                    }
                });
                return {data, display: `see more ${genre.genre.replace(/&/, 'or').toLowerCase()} media`, type: 'BASIC'};
            }
        }

        return {data: [], display: 'none', type: 'basic'};
    }

    /**
     * @desc gets related media based on user activity and media
     * @param userId - the id of the user to query the database for
     */
    private async getMediaRecommend(userId: string) {
        const response = await this.baseRecommend(userId);
        if (response) {
            const {seen, ratings, suggestions, watched} = response;
            const count = this.sortArray(this.countAppearances<{ id: number, name: string, poster: string, background: string, type: MediaType }, 'id', 'count'>([seen, ratings, suggestions, watched], 'count', 'id'), 'count', 'desc');

            if (count.length > 10) {
                const data = count[Math.floor(Math.random() * count.length)];

                const media = await this.prisma.media.findUnique({where: {id: data.id}});

                if (media) {
                    const recon = await this.tmdb?.getRecommendations(media.tmdbId, media.type, 2) || [];
                    const tmdbIds = recon.map(e => e.id).filter(e => e !== media.tmdbId);
                    let recommendations = await this.prisma.media.findMany({
                        where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]},
                        select: {id: true, poster: true, name: true, type: true, background: true},
                        orderBy: {
                            vote_average: 'desc'
                        }
                    });

                    return {
                        data: this.randomise(recommendations, 12, 0),
                        display: `what to watch after ${media.name.toLowerCase()}`,
                        type: 'BASIC'
                    };
                }
            }
        }

        return {data: [], display: 'none', type: 'basic'};
    }

    /**
     * @desc gets related media based on user activity
     * @param userId - the id of the user to query the database for
     */
    private async baseRecommend(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {userId}, include: {
                seen: {include: {media: {include: {castCrews: true}}}},
                ratings: {include: {media: {include: {castCrews: true}}}},
                suggestions: {include: {media: {include: {castCrews: true}}}}
            }
        });
        if (user) {
            const userWatched = await this.prisma.watched.groupBy({
                by: ['mediaId'], _sum: {times: true}, where: {userId: user.userId}
            })
            const mediaIds = userWatched.map(e => e.mediaId);
            let watched = (await this.prisma.media.findMany({
                where: {id: {in: mediaIds}}, include: {castCrews: true}, orderBy: {
                    vote_average: 'desc'
                }
            })).map(e => {
                const med = userWatched.find(f => f.mediaId === e.id);
                return {
                    id: e.id,
                    poster: e.poster,
                    name: e.name,
                    type: e.type,
                    genre: e.genre,
                    castCrews: e.castCrews,
                    background: e.background,
                    count: med?._sum?.times || 0
                }
            });

            watched = this.sortArray(watched, 'count', 'desc');
            let {seen: s, ratings: r, suggestions: t} = user;

            const seen = this.sortArray(s.map(e => {
                return {
                    id: e.media.id,
                    type: e.media.type,
                    poster: e.media.poster,
                    background: e.media.background,
                    name: e.media.name,
                    genre: e.media.genre,
                    castCrews: e.media.castCrews,
                    count: e.times
                }
            }), 'count', 'desc').slice(0, 10);
            const ratings = this.sortArray(r.map(e => {
                return {
                    id: e.media.id,
                    type: e.media.type,
                    poster: e.media.poster,
                    background: e.media.background,
                    name: e.media.name,
                    genre: e.media.genre,
                    castCrews: e.media.castCrews,
                    count: e.rate
                }
            }), 'count', 'desc').slice(0, 10);
            const suggestions = this.sortArray(t.map(e => {
                return {
                    id: e.media.id,
                    type: e.media.type,
                    poster: e.media.poster,
                    background: e.media.background,
                    name: e.media.name,
                    genre: e.media.genre,
                    castCrews: e.media.castCrews,
                    count: e.times
                }
            }), 'count', 'desc').slice(0, 10);

            return {
                watched, seen, ratings, suggestions
            };
        }

        return null;
    }
}