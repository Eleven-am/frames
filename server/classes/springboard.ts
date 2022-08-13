import MediaClass, {MedForMod, SpringMedia, UpNext} from "./media";
import Playback, {SpringPlay} from "./playback";
import Playlist from "./playlist";
import User, {NotificationInterface} from "./user";
import PickAndFrame, {UpdateSearch} from "./pickAndFrame";
import {CompType, tmdbMedia} from "./tmdb";
import {CastType, Media, MediaType, Prisma, Role} from "@prisma/client";
import {ServiceType} from "./fileReader";

export type PlayBackKeys = 'PLAYLIST' | 'AUTH' | 'EPISODE' | 'MEDIA' | 'IDENTIFIER' | 'SHUFFLE' | 'FRAME' | 'ROOMKEY' | 'SHUFFLE_PLAYLISTS';

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

export interface FramesCollections {
    id: number;
    name: string;
    poster: string;
    background: string;
    images: string[];
    media: Pick<SpringMedia, 'id' | 'type' | 'name' | 'poster' | 'background'>[];
}

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

export default class Springboard extends MediaClass {
    private readonly playback: Playback;
    private readonly playlist: Playlist;
    private readonly user: User;

    constructor(serviceType?: ServiceType) {
        super(serviceType);
        this.playback = new Playback();
        this.playlist = new Playlist();
        this.user = new User();
    }

    /**
     * @desc gets the next video to be played either from the playlist or the database in general
     * @param auth - the video view auth token
     * @param userId - the user identifier
     */
    public async getUpNext(auth: string, userId: string): Promise<UpNext | null> {
        let videoId: number | null = null;
        let playlistId: number | null = null;
        const view = await this.prisma.view.findUnique({where: {auth}, include: {video: {include: {media: true}}}});
        if (view && view.playlistId) {
            const video = await this.playlist.retrieveNextVideo(view.playlistId);
            videoId = video?.videoId || null;
            playlistId = video?.id || null;

        } else if (view) videoId = view.videoId;

        if (videoId) {
            const upNextVideoId = playlistId ? videoId : await this.user.getNextVideoId(videoId, userId);
            if (upNextVideoId) {
                const data = await this.getInfoFromVideoId(upNextVideoId, true);
                if (data) {
                    if (playlistId) return {
                        ...data, type: 'PLAYLIST', playlistId, location: 'watch?playlistId=' + playlistId
                    }

                    else return {...data, location: data.location + '&resetPosition=true'};
                }
            }
        }

        return null;
    }

    /**
     * @desc get all contents not in the database
     * @param userId - the user requesting the contents
     */
    public async getUnScanned(userId: string) {
        let unScanned: MedForMod[] = [];
        if (await this.user.isAdmin(userId)) {
            const videos = await this.prisma.video.findMany();
            const folder = await this.prisma.folder.findMany();

            let movies = await this.drive.recursiveReadFolder(this.moviesLocation || '') || [];
            movies = movies.filter(file => videos.every(video => video.location !== file.location));

            let tvShows = await this.drive.readFolder(this.showsLocation || '') || [];
            tvShows = tvShows.filter(file => folder.every(show => show.location !== file.location));

            for await (const movie of movies) {
                const {backup, results} = await this.scanMediaHelper(movie, MediaType.MOVIE);
                const suggestions = backup.length ? backup : results;
                unScanned.push({
                    logo: '',
                    mediaId: 0,
                    stateType: 'ADD',
                    name: suggestions.length ? suggestions[0].name : movie.name!,
                    file: movie,
                    type: MediaType.MOVIE,
                    suggestions,
                    poster: '',
                    year: suggestions.length ? suggestions[0].year : new Date().getFullYear(),
                    backdrop: suggestions.length ? suggestions[0].backdrop || '' : '',
                    tmdbId: suggestions.length ? suggestions[0].tmdbId || 0 : 0,
                })
            }

            for await (const show of tvShows) {
                const {backup, results} = await this.scanMediaHelper(show, MediaType.SHOW);
                const suggestions = backup.length ? backup : results;
                unScanned.push({
                    logo: '',
                    mediaId: 0,
                    stateType: 'ADD',
                    name: suggestions.length ? suggestions[0].name : show.name!,
                    file: show,
                    type: MediaType.SHOW,
                    suggestions,
                    poster: '',
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
                name: true, poster: true, backdrop: true, logo: true, type: true, tmdbId: true, id: true, overview: true
            }, where: {
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
                id: e.id,
                name: e.name,
                type: 'PERSON',
                logo: e.profile_path,
                tmdbId: e.id,
                popularity: e.popularity,
                backdrop: e.profile_path ? `https://image.tmdb.org/t/p/original${e.profile_path}` : null,
                libraryName: null,
                drift: this.levenshtein(e.name, value),
                overview: e.known_for.map((entry, i) => `${entry.name ? entry.name : entry.title}${i === e.known_for.length - 2 ? ' and ' : ', '}`).join('').replace(/, $/, '.')
            }
        });

        const mediaItems: GetContentSearch[] = movies.concat(shows).filter(e => e.backdrop_path && e.overview).map(e => {
            const med = media.find(item => item.tmdbId === e.id);
            return {
                download: false,
                libraryName: med?.name || null,
                popularity: e.popularity,
                name: e.name ? e.name : e.title || '',
                drift: this.levenshtein(e.name ? e.name : e.title || '', value),
                type: e.name ? 'SHOW' : 'MOVIE',
                id: e.id,
                overview: e.overview || '',
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
                where: {AND: [{tmdbId: {in: recIds}}, {type}]}, select: {tmdbId: true, name: true}
            });

            if (tmdbMedia) {
                if (tmdbMedia.belongs_to_collection) {
                    const cols = await this.tmdb?.getMovieCollection(tmdbMedia.belongs_to_collection.id) || null;
                    collection = cols?.parts || [];
                }

                const present = media.find(e => e.tmdbId === tmdbId);
                const defMedia: GetContentSearch = {
                    download: true,
                    drift: 0,
                    id: tmdbMedia.id,
                    popularity: tmdbMedia.popularity,
                    overview: tmdbMedia.overview || '',
                    name: tmdbMedia.name || tmdbMedia.title || '',
                    type,
                    libraryName: present?.name || null,
                    backdrop: tmdbMedia.backdrop_path ? "https://image.tmdb.org/t/p/original" + tmdbMedia.backdrop_path : null,
                }

                const res = collection.concat(this.sortArray(recommendations, 'popularity', 'desc')).map(e => {
                    const med = media.find(item => item.tmdbId === e.id);
                    return {
                        download: true,
                        libraryName: med?.name || null,
                        popularity: e.popularity,
                        name: e.name ? e.name : e.title || '',
                        drift: 0,
                        type,
                        id: e.id,
                        overview: e.overview || '',
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
                        download: true,
                        libraryName: med?.name || null,
                        popularity: e.popularity,
                        name: e.name ? e.name : e.title || '',
                        drift: 0,
                        type: type,
                        id: e.id,
                        overview: e.overview || '',
                        backdrop: e.backdrop_path ? "https://image.tmdb.org/t/p/original" + e.backdrop_path : null,
                    }
                }), ['type', 'id']) as GetContentSearch[];
            }
        }

        return [];
    }

    /**
     * @desc get the manage sections for the admin
     * @param userId - the user requesting the sections
     */
    public async getManage(userId: string) {
        let manage = ['library', 'manage picks', 'manage keys', 'manage users', 'system config'];

        if (await this.user.isAdmin(userId)) await this.deluge.delugeActive() ? manage.splice(2, 0, 'get contents') : manage;

        return manage;
    }

    /**
     * @desc gets basic user recommendations from the database for a specific user
     * @param userId - the id of the user to query the database for
     */
    public async getDisplayRecommended(userId: string) {
        const value = this.weightedRandom({
            'media': 0.30, 'basic': 0.20, 'similar': 0.15, 'genre': 0.15, 'name': 0.13, 'char': 0.07,
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
            case 'similar':
                return await this.getSimilarWatched(userId);
        }

        return null;
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
     * @desc finds a media item by their name and for multiple copies it returns the most recent version
     * @param request - the request string sent from the client
     * @param type - the type of media to search for
     */
    public async findMedia(request: string, type: MediaType): Promise<number> {
        const response = await this.prisma.media.findMany({where: {type, name: {contains: request}}});
        let data = response.map(item => {
            const year = item.release?.getFullYear();
            const drift =  this.levenshtein(item.name, request);
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
            const drift = this.levenshtein(e.name, request);
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
                const drift = this.levenshtein(e.name, request);
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
                const drift = this.levenshtein(e.name, request);
                return {...e, drift};
            });

        const data = this.sortArray(media, 'drift', 'asc');
        return data.length ? data[0].id : -1;
    }

    /**
     * @desc gets the SpringPlay object for playback of a media item
     * @param mediaId - the media identifier
     * @param userId - the user identifier for the current user
     * @param inform - weather to inform the database about the playback
     * @param type - the type of media to get the SpringPlay object for
     */
    public async startPlayback(mediaId: string, userId: string, inform: boolean, type: PlayBackKeys): Promise<SpringPlay | null> {
        const frameClass = new PickAndFrame();
        if (userId === 'unknown' && type !== 'FRAME') return null;

        switch (type) {
            case 'PLAYLIST':
                return this.playlist.generatePlayback(+mediaId, userId);

            case 'SHUFFLE':
                const shuffle = await this.playlist.shuffleMedia(+mediaId, userId);
                return shuffle ? this.playlist.generatePlayback(shuffle.id, userId) : null;

            case 'IDENTIFIER':
                const video = await this.playlist.findFirstVideo(mediaId, userId);
                return video ? this.playlist.generatePlayback(video.id, userId) : null;

            case 'SHUFFLE_PLAYLISTS':
                const shufflePlaylists = await this.playlist.shufflePlaylist(mediaId, userId);
                return shufflePlaylists ? this.playlist.generatePlayback(shufflePlaylists.id, userId) : null;

            case 'MEDIA':
                const media = await this.prisma.media.findUnique({where: {id: +mediaId}, include: {videos: true}});
                if (media) {
                    if (media.type === MediaType.MOVIE) return await this.playback.setPlayBack(media.videos[0].id, userId, inform, null);

                    else {
                        const episode = await this.user.getNextEpisode(media.id, userId);
                        if (episode) {
                            const data = await this.playback.setPlayBack(episode.episode.videoId, userId, inform, null);
                            return data ? {...data, position: episode.position} : null;
                        }
                    }
                }
                return null;

            case 'EPISODE':
                const episode = await this.prisma.episode.findUnique({where: {id: +mediaId}});
                return episode ? this.playback.setPlayBack(episode.videoId, userId, inform, null) : null;

            case 'FRAME':
                return await frameClass.decryptCipher(mediaId);

            case 'ROOMKEY':
                return await frameClass.decryptRoom(mediaId, userId);

            case 'AUTH':
                return await this.playback.getPlayBack(mediaId, userId, inform);
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
            }, orderBy: {release: 'asc'}
        });
        const tmdbCollection = await this.tmdb?.getMovieCollection(id);
        if (collection.length && tmdbCollection) return {
            id,
            media: collection,
            name: tmdbCollection.name,
            images: this.shuffle(collection, collection.length, 0).map(item => item.poster),
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
     * @desc gets the details of a specific person in the castCrew table of the database
     * @param id - the id of the person to query the database for
     */
    public async getPerson(id: number): Promise<PersonInterface | null> {
        const person = await this.tmdb?.getPerson(id);
        const bibliography = await this.tmdb?.getBibliography(id);
        if (person && bibliography) {
            const data = await this.prisma.castCrew.findMany({
                where: {tmdbId: id}, include: {
                    media: true,
                },
            });

            const movCast = await this.prisma.media.findMany({
                where: {
                    tmdbId: {
                        in: bibliography.movies.cast.map(movie => movie.id)
                    }, type: MediaType.MOVIE,
                },
                orderBy: {release: 'asc'}
            });
            const shoCast = await this.prisma.media.findMany({
                where: {
                    tmdbId: {
                        in: bibliography.shows.cast.map(show => show.id)
                    }, type: MediaType.SHOW,
                },
                orderBy: {release: 'asc'}
            });

            const movCrew = await this.prisma.media.findMany({
                where: {
                    tmdbId: {
                        in: bibliography.movies.crew.map(movie => movie.id)
                    }, type: MediaType.MOVIE,
                },
                orderBy: {release: 'asc'}
            });
            const shoCrew = await this.prisma.media.findMany({
                where: {
                    tmdbId: {
                        in: bibliography.shows.crew.map(show => show.id)
                    }, type: MediaType.SHOW,
                },
                orderBy: {release: 'asc'}
            });

            const movMedData = this.intersect(movCrew, bibliography.movies.crew, 'tmdbId', 'id', 'job');
            const shoMedData = this.intersect(shoCrew, bibliography.shows.crew, 'tmdbId', 'id', 'job');

            const crew = [...movMedData, ...shoMedData];

            const directed = data.filter(item => item.type === CastType.DIRECTOR);
            const cast = data.filter(item => item.type === CastType.ACTOR);
            const produced = data.filter(item => item.type === CastType.PRODUCER);
            const wrote = data.filter(item => item.type === CastType.WRITER);

            const directedMedia = this.sortArray(this.uniqueId(directed.map(item => item.media).concat(crew.filter(e => e.job === 'Director')), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const castMedia = this.sortArray(this.uniqueId(cast.map(item => item.media).concat([...movCast, ...shoCast]), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const producedMedia = this.sortArray(this.uniqueId(produced.map(item => item.media).concat(crew.filter(e => e.job === 'Executive Producer')), 'id'), 'release', 'desc').map(e => {
                const {poster, type, id, name, background} = e;
                return {poster, type, id, name, background};
            });

            const writtenMedia = this.sortArray(this.uniqueId(wrote.map(item => item.media).concat(crew.filter(e => /^Writer|Story|Screenplay$/i.test(e.job))), 'id'), 'release', 'desc').map(e => {
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
     * @desc generates the suggestion list for all users
     */
    public async generateGlobalSuggestions(): Promise<void> {
        const users = await this.prisma.user.findMany();

        const promises = users.map(e => this.user.generateSuggestions(e.userId));
        await Promise.all(promises);
    }

    /**
     * @desc broadcasts a notification to all users
     * @param message - The message to send
     * @param title - The title of the message
     * @param image - The image for the message to send
     * @param url - The url to send
     * @param type - The type of the message
     * @param payload - Optional data to be sent to the client
     */
    public async informAllUsers(message: string, title: string, image: string, url: string, type: string, payload?: any) {
        const users = await this.prisma.user.findMany();
        const senderUser = await this.prisma.user.findUnique({where: {email: 'frames AI'}});
        if (users && senderUser) {
            const data = {
                message, opened: false, senderId: senderUser.userId, title, image, url, receiverId: '',
            }

            const notifications = users.map(user => {
                data.receiverId = user.userId;
                return data;
            });

            await this.prisma.notification.createMany({data: notifications});
            const notification: NotificationInterface = {
                message,
                opened: false,
                type,
                sender: senderUser.email.split('@')[0] || 'frames AI',
                title,
                data: payload
            }
            await this.broadCast(notification);
        }
    }

    /**
     * @desc broadcasts a message to all users
     * @param message - The message to broadcast
     */
    public async broadCast(message: NotificationInterface) {
        const channel = `globalNotification:${this.regrouped.user?.notificationId}`;
        await this.push(message, channel);
    }

    /**
     * @desc Send a message to all non-guest users that the server would be down for maintenance
     * @param timeFrame - The time frame for the server to be down
     * @param startTime - The start time of the maintenance
     * @param endTime - The end time of the maintenance
     * @param downService - The service that is down
     */
    public async maintenance(timeFrame: number, startTime: string, endTime: string, downService: string) {
        const users = await this.prisma.user.findMany({
            where: {
                role: {
                    not: Role.GUEST
                }
            }
        });
        if (users) {
            const notification: NotificationInterface = {
                message: `The ${downService} feature(s) will be down for maintenance for ${timeFrame} minutes from ${startTime} to ${endTime}`,
                opened: false,
                type: 'maintenance',
                sender: 'frames AI',
                title: 'Maintenance',
                data: null
            }

            await this.broadCast(notification);
            const promises = users.map(user => {
                this.sendEmail(user.email, 'Maintenance', `<h1>Routine Maintenance</h1><p>The ${downService} feature(s) will be down for maintenance for ${timeFrame} minutes from ${startTime} to ${endTime}</p>`);
            });

            await Promise.all(promises);
        }
    }

    /**
     * @desc creates the SEO data for the page
     * @param type - type of the page
     * @param value - value of the page
     */
    public async getMetaTags(type: string, value: string) {
        if (type === 'movie' || type === 'show') {
            const media = await this.prisma.media.findMany({
                where: {name: {contains: value, mode: "insensitive"}}
            })

            const response = media.map(item => {
                const year = new Date(item.release || 0).getFullYear();
                const drift = item.name.length - value.length;
                return {...item, year, drift};
            })

            const info = this.sortArray(response, ['drift', 'year'], ['asc', 'desc'])[0];
            if (info)
                return {
                    overview: info.overview, name: info.name, poster: info.poster
                }
        }

        if (type === 'watch' || type === 'frame' || type === 'room') {
            if (type === 'room') {
                const room = await this.prisma.room.findUnique({
                    where: {roomKey: value}
                });

                value = room ? room.auth : value;
            } else if (type === 'frame') {
                const frame = await this.prisma.frame.findUnique({
                    where: {cypher: value}
                });

                value = frame ? frame.auth : value;
            }

            const view = await this.prisma.view.findUnique({
                where: {auth: value},
                include: {episode: true, video: {include: {media: true}}}
            })

            if (view) {
                const {episode, video} = view;
                let {name, overview, poster, tmdbId} = video.media;

                if (episode) {
                    const episodeInfo = await this.tmdb?.getEpisode(tmdbId, episode.seasonId, episode.episode);
                    name = /^Episode \d+/i.test(episodeInfo?.name || 'Episode') ? `${name}: S${episode.seasonId}, E${episode.episode}` : `S${episode.seasonId}, E${episode.episode}: ${episodeInfo?.name}`;
                    overview = episodeInfo?.overview || overview;
                }

                return {
                    overview, name, poster
                }
            }
        }

        if (type === 'person') {
            const person = await this.tmdb?.findPerson(value);
            if (person) return {
                overview: `See all media produced by ${person.name} available on Frames`,
                name: person.name,
                poster: 'https://image.tmdb.org/t/p/original' + person.profile_path
            }
        }

        if (type === 'collection') {
            const media = await this.prisma.media.findMany({
                where: {
                    collection: {
                        path: ['name'], string_contains: value
                    }
                }
            });

            let data = media.map(e => e.collection as { name: string, id: number }).filter(e => e)
                .map(e => {
                    const drift = this.levenshtein(e.name, value);
                    return {...e, drift};
                });

            data = this.sortArray(data, 'drift', 'asc');
            if (data.length) {
                const collection = await this.tmdb?.getMovieCollection(data[0].id);
                if (collection) {
                    const {poster_path, name} = collection;
                    return {
                        name,
                        overview: `See all media in ${name} available on Frames`,
                        poster: poster_path ? 'https://image.tmdb.org/t/p/original' + poster_path : '',
                    }
                }
            }
        }

        return {
            overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
            name: 'Frames - Watch FREE TV Shows and Movies Online',
            poster: '/meta.png'
        }
    }

    /**
     * @desc Deletes a media if the user is admin
     * @param userId - the id of the user to check if he is admin
     * @param location - the location of the media to be deleted
     */
    public async deleteMedia(userId: string, location: string): Promise<{ name: string } | null> {
        if (await this.user.isAdmin(userId)) {
            const name = (await this.drive.getFile(location))?.name;
            await this.drive.deleteFileOrFolder(location);
            return name ? {name} : null;
        }

        return null;
    }

    /**
     * @desc gets the similarity between a user and all other users
     * @param userId - The user to compare
     */
    private async getSimilarUsers(userId: string) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const otherUsers = await this.prisma.user.findMany({where: {userId: {not: userId}}});

        if (user) {
            const similarUsers = otherUsers.map(async e => {
                const username = e.email.split('@')[0];
                const similarity = await this.user.getSimilarityIndex(user.userId, e.userId);
                return {
                    userId: e.userId, username, similarity
                }
            });
            let users = await Promise.all(similarUsers);
            users = this.sortArray(users, 'similarity', 'desc');
            return this.normalise(users, 'similarity');
        }

        return [];
    }

    /**
     * @desc gets media recommendations for a user based on what similar users have watched
     * @param userId - The user to get recommendations for
     */
    private async getSimilarWatched(userId: string) {
        const user = await this.prisma.user.findUnique({where: {userId}, include: {suggestions: true}});
        const users = (await this.getSimilarUsers(userId)).filter(e => Math.round((e.similarity + Number.EPSILON) * 100) / 100 > 0.5);
        const randFromUsers = users.length ? users[Math.floor(Math.random() * users.length)] : null;
        const randomUser = await this.prisma.user.findUnique({
            where: {userId: randFromUsers?.userId},
            include: {suggestions: true}
        });

        if (randomUser && user) {
            const suggestions = user.suggestions;
            const aWeekAgo = new Date(Date.now() - (1000 * 60 * 60 * 24 * 7));
            const watched = await this.prisma.watched.findMany({
                where: {userId: randomUser.userId, updated: {gte: aWeekAgo}, position: {gt: 0}},
                include: {media: true},
                orderBy: {updated: 'desc'}
            });

            const media = this.sortArray(watched.map(e => e.media), 'vote_average', 'desc');
            let suggestedMedia = this.intersect(media, suggestions, 'id', 'mediaId', 'times');
            suggestedMedia = this.sortArray(suggestedMedia, 'times', 'desc');
            const data: Media[] = this.uniqueId([...suggestedMedia, ...media], 'id');

            return {
                display: `see what ${randomUser.email.split('@')[0]} has watched recently`,
                type: 'BASIC',
                data: data.slice(0, 12).map(e => {
                    const {id, name, type, background, poster} = e;
                    return {id, name, type, background, poster};
                })
            }
        }

        return {data: [], display: 'none', type: 'basic'};
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
                        data: this.sortArray(this.shuffle(recommendations, 12, 0), 'vote_average', 'desc'),
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
                    data: this.shuffle(data, 12, 0),
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
                    data: this.shuffle(data, 12, 0),
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
                const data = this.shuffle(media, 12, 0).map(e => {
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
                        data: this.shuffle(recommendations, 12, 0),
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
                seenMedia: {include: {media: {include: {castCrews: true}}}},
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
            let {seenMedia: s, ratings: r, suggestions: t} = user;

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
