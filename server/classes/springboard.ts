import Media, {MediaInfo, MediaSection} from "./media";
import {Generator, Media as Med, MediaType} from "@prisma/client";
import {create_UUID, takeFive} from "../base/baseFunctions";
import {FramesPerson, slimTrending, trending} from "../base/tmdb_hook";
import Playback, {SectionInterface} from "./playback";
import {prisma} from '../base/utils';
import {Playlist} from "./listEditors";
import {DetailedEpisode} from "./episode";
import env from "../base/env";

const play = new Playback();
const playlist = new Playlist();

type Modify<T, R> = Omit<T, keyof R> & R;

type P = Modify<MediaInfo, {
    production: Array<{ id: string, name: string }>
}>

export interface SpringMediaInfo extends P {
    seen: boolean;
    myRating: number;
    myList: boolean;
    download: boolean;
}

export interface SpringLoad {
    videoId: number;
    position: number;
    mediaId: number;
    overview: string;
    logo: string;
    backdrop: string;
    name: string;
    episodeName?: string;
    poster?: string;
}

export interface SpringPlay extends SpringLoad {
    inform: boolean;
    frame: boolean
    location: string
    cdn: string;
    guest: boolean;
    subs: ({ language: string, url: any })[]
    playlistId?: number;
}

export interface search extends MediaSection {
    diff?: number;
}

export interface Banner extends MediaSection {
    trailer: string | null;
    overview: string;
}

export default class Springboard extends Media {

    /**
     * @desc returns TRUE if the user has completely seen the media at least once
     * @param mediaId
     * @param userId
     */
    private static async checkSeen(mediaId: number, userId: string): Promise<boolean> {
        let media = await prisma.media.findUnique({where: {id: mediaId}});
        if (media) {
            if (media.type === MediaType.MOVIE)
                return !!(await prisma.view.findMany({
                    where: {
                        position: {gt: 919},
                        userId,
                        video: {mediaId}
                    }
                })).length;
            else {
                const episodes = await prisma.episode.findMany({where: {showId: mediaId}});
                const views = await prisma.view.findMany({where: {position: {gt: 919}, userId, episode: {showId: mediaId}}});
                const seen = views.filterInFilter(episodes, 'videoId', 'videoId');
                return !seen.length;
            }

        } else return false;
    }

    /**
     * @param mediaId media to be processed
     * @param slim summarised processing / not
     * @param userId for what user to be processed
     * @returns media info for the display section
     */
    async getInfo(mediaId: number, userId: string, slim = false): Promise<SpringMediaInfo | null> {
        let info = await super.getInfo(mediaId, userId, slim);
        if (info) {
            let user = await prisma.user.findFirst({
                where: {userId},
                include: {lists: {where: {mediaId}}, ratings: {where: {mediaId}}}
            });
            if (user) {
                let seen = await Springboard.checkSeen(mediaId, userId);
                let myList = !!user.lists.length;
                let myRating = user.ratings.length ? (user.ratings[0].rate * 10) : 5;

                return {...info, seen, myList, myRating, download: !!env.config.deluge && info.type === MediaType.SHOW};
            }
        }
        return null;
    }

    /**
     * @returns Promise<SectionInterface> items recently added to the database for the recently added section
     */
    async getRecent(): Promise<SectionInterface> {
        let recent = await prisma.media.findMany({
            orderBy: {updated: 'desc'},
            select: {id: true, type: true, poster: true, name: true, background: true}
        });
        return {type: 'basic', data: takeFive(recent, 10).result, display: 'recently added'};
    }

    /**
     * @description Finds the most trending movies/Tv shows for the banner
     * @returns Promise<MediaLibrary[]> a list of the trending media for the à la une section
     */
    async bannerTrending() {
        let {movies, tv} = await slimTrending();
        let dBase: Banner[] = await prisma.media.findMany({
            select: {
                trailer: true,
                type: true,
                overview: true,
                backdrop: true,
                logo: true,
                name: true,
                tmdbId: true,
                id: true
            }
        });
        let moviesData: Med[] = movies.collapse(dBase, MediaType.MOVIE, 'popularity');
        let tvData: Med[] = tv.collapse(dBase, MediaType.SHOW, 'popularity');
        dBase = moviesData.concat(tvData).map(e => {
            let {id, overview, backdrop, name, logo, type, trailer} = e;
            return {id, overview, backdrop, name, logo, type, trailer}
        }).filter(e => e.logo !== '').sortKey('popularity', false);
        return takeFive(dBase, 7).result;
    }

    /**
     * @param videoId video we need the follower for
     * @param userId user to be processed
     * @returns the next sequential video for playback
     */
    async upNext(videoId: number, userId: string): Promise<DetailedEpisode | null> {
        let info = await super.upNext(videoId);
        if (info)
            return info;

        let media = await prisma.media.findFirst({where: {videos: {some: {id: videoId}}}});
        if (media && media.type === MediaType.SHOW) {
            let database = await prisma.media.findMany();
            let info: Med[] = (await this.getRecommendation(media.id, media.tmdbId, database, media.type)).recommendations;
            let pos = Math.floor(Math.random() * info.length);
            let index = info[pos];
            let episode = await play.getNextEpisode(index.id, userId);
            if (episode) {
                let info = await this.getEpisode(episode.id);
                if (info)
                    return {...info, type: MediaType.SHOW, id: episode.id}
            }
        }

        return null;
    }

    /**
     * @param mediaId media to be processed
     * @param userId user to be processed
     * @param episode? set to true if mediaId is episodeId
     * @returns Promise<SpringPlay|null> playback object for the frames player
     */
    async playMedia(mediaId: number, userId: string, episode = false): Promise<SpringPlay | null> {
        let springPLay = !episode ? await this.loadPlayer(mediaId, userId) : await play.playEpisode(mediaId, userId);
        if (springPLay) {
            const res = await play.generatePlayback(springPLay.videoId, userId);

            if (res)
                return {...springPLay, ...res}
        }

        return null;
    }

    /**
     * @desc returns the trending movies/shows on TMDB ATM that are available on the database, sorted by popularity
     * @returns {Promise<SectionInterface>}
     */
    async getTrending(): Promise<SectionInterface> {
        let dBase = await prisma.media.findMany();
        let data: MediaSection[] = await trending(3, dBase);
        data = data.map(e => {
            return {
                background: e.background,
                id: e.id, type: e.type,
                name: e.name, poster: e.poster
            }
        })

        return {type: 'basic', display: 'what others are watching', data}
    }

    /**
     * @returns Promise<string[]> posters of the Trending images at the moment
     */
    async authImages(app = false): Promise<string[]> {
        let dBase = await prisma.media.findMany({select: {id: true, poster: true, type: true, tmdbId: true}});
        let {movies, tv} = await slimTrending();
        let moviesData: Med[] = movies.collapse(dBase, MediaType.MOVIE, 'popularity');
        let tvData: Med[] = tv.collapse(dBase, MediaType.SHOW, 'popularity');
        dBase = moviesData.concat(tvData).sortKey('popularity', false);

        if (!app)
            return dBase.map(e => {
            return e.poster
        }).slice(0, 10);

        else {
            moviesData = movies.collapse(dBase, MediaType.MOVIE, 'poster_path');
            tvData = tv.collapse(dBase, MediaType.SHOW, 'poster_path');

            let poster: any[] = moviesData.concat(tvData);
            const response: string[] = [];
            poster = poster.map(e => {
                e.poster_path = 'https://image.tmdb.org/t/p/original' + e.poster_path;
                return e;
            });

            for (let item of dBase) {
                const file = poster.find(e => e.id === item.id);
                response.push(file.poster_path || item.poster);
            }

            return response.slice(0, 10);
        }
    }

    /**
     * @desc finds a media item by their name and for multiple copies it returns the most recent version
     * @param request
     * @param type
     */
    async findMedia(request: string, type: MediaType): Promise<number> {
        let response: any[] = await prisma.media.findMany({where: {type, name: {contains: request}}});
        response = response.map(item => {
            item.year = parseInt(item.release.replace(/\w{3} /, ''))
            item.drift = item.name.Levenshtein(request);
            return item;
        }).sortKeys('drift', 'year', true, false);
        return response.length ? response[0].id : -1;
    }

    /**
     * @desc adds media to seen or removes from seen on user input
     * @param mediaId
     * @param userId
     */
    async markAsSeen(mediaId: number, userId: string): Promise<boolean> {
        let media = await prisma.media.findFirst({where: {id: mediaId}});
        let seen = await Springboard.checkSeen(mediaId, userId);

        if (media && media.type === MediaType.MOVIE) {
            let video = await prisma.video.findFirst({where: {mediaId}});
            if (video) {
                if (!seen) {
                    let obj = {
                        auth: create_UUID(),
                        created: new Date(),
                        userId,
                        position: Math.floor(Math.random() * (1000 - 920 + 1)) + 920,
                        videoId: video.id,
                        updated: new Date(),
                        episodeId: null,
                        finished: 1
                    }

                    await prisma.view.create({data: obj});
                    return true;

                } else
                    await prisma.view.deleteMany({where: {userId, videoId: video.id}});

            }
        } else if (media && media.type === MediaType.SHOW) {
            let episodes = await prisma.episode.findMany({where: {showId: mediaId}});
            if (seen)
                await prisma.view.deleteMany({where: {userId, episode: {showId: mediaId}}})

            else {
                let views = episodes.map(e => {
                    return {
                        auth: create_UUID(),
                        created: new Date(),
                        userId,
                        position: Math.floor(Math.random() * (1000 - 920 + 1)) + 920,
                        videoId: e.videoId,
                        updated: new Date(),
                        episodeId: e.id,
                        finished: 2
                    }
                })

                await prisma.view.createMany({data: views});
                return true;
            }
        }

        return false
    }

    /**
     * @desc returns the information necessary for metaTags
     * @param type
     * @param value
     */
    async metaTags(type: string, value: string): Promise<{ overview: string, name: string, poster: string }> {
        if (type === 'movie' || type === 'show') {
            let id = await this.findMedia(value, type === 'movie' ? MediaType.MOVIE : MediaType.SHOW);
            if (id !== -1) {
                let media = await prisma.media.findFirst({where: {id}});
                if (media)
                    return {
                        overview: media.overview,
                        name: media.name,
                        poster: media.poster
                    }
            }
        }

        if (type === 'watch' || type === 'frame') {
            if (type === 'frame') {
                let frame = await prisma.frame.findUnique({where: {cypher: value}});
                value = frame ? frame.auth : value;
            }

            let info = await prisma.view.findFirst({
                where: {auth: value}, include: {
                    video: {
                        include: {
                            media: true
                        }
                    }
                }
            })
            if (info) {
                if (info.episodeId) {
                    let episode = await this.getEpisode(info.episodeId);
                    if (episode) {
                        return {
                            name: /^Episode \d+/.test(episode.name) ? `${info.video.media.name}: S${episode.seasonId}, E${episode.episode}` : `S${episode.seasonId}, E${episode.episode}: ${episode.name}`,
                            overview: episode.overview || info.video.media.overview,
                            poster: info.video.media.poster
                        }
                    }
                }

                return {
                    name: info.video.media.name,
                    overview: info.video.media.overview,
                    poster: info.video.media.poster
                }
            }

        }

        return {
            overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
            name: 'Frames - Watch FREE TV Shows and Movies Online',
            poster: '/api/images/meta'
        }
    }

    /**
     * @desc searches through regex or levenshtein algorithm based on the search boolean
     * @param searchValue
     * @param search REGEX |! Levenshtein
     */
    async search(searchValue: string, search: boolean): Promise<search[]> {
        if (search)
            return (await prisma.media.findMany({
                select: {name: true, backdrop: true, logo: true, type: true, id: true},
                where: {name: {contains: searchValue}},
            })).map(e => {
                return {...e, length: e.name.length}
            }).sortKey('length', true).slice(0, 16);

        else {
            let data: search[] = await prisma.media.findMany({
                select: {name: true, type: true, id: true},
                orderBy: {name: 'asc'}
            });
            return data.map(e => {
                const words = e.name.split(' ');
                let data = words.map(e => {
                    return {
                        diff: searchValue.Levenshtein(e)
                    }
                }).sortKey('diff', true);
                e.diff = data[0].diff;
                return e;
            }).sortKey('diff', true).slice(0, 12);
        }
    }

    /**
     * @desc finds media to play by their auth
     * @param auth
     * @param userId
     */
    async findByAuth(auth: string, userId: string): Promise<SpringPlay | null> {
        let playback = await play.findByAuth(auth, userId);
        if (playback) {
            let res = await play.generatePlayback(playback.videoId, userId);

            let media = await prisma.media.findFirst({where: {id: playback.mediaId}})
            if (media && res) {
                if (playback.mediaId === playback.id)
                    return {
                        mediaId: media.id, ...res,
                        videoId: playback.videoId,
                        position: playback.position,
                        overview: media.overview,
                        logo: media.logo,
                        poster: media.poster,
                        backdrop: media.backdrop,
                        name: media.name
                    }

                else {
                    let episode = await this.getEpisode(playback.id);

                    if (episode)
                        return {
                            ...res, mediaId: media.id,
                            videoId: playback.videoId,
                            position: playback.position,
                            overview: episode.overview || media.overview,
                            logo: media.logo,
                            poster: media.poster,
                            backdrop: media.backdrop,
                            name: media.name,
                            episodeName: /^Episode \d+/.test(episode.name) ? `${media.name}: S${episode.seasonId}, E${episode.episode}` : `S${episode.seasonId}, E${episode.episode}: ${episode.name}`
                        }
                }
            }
        }

        return null;
    }

    /**
     * @desc attempts to shuffle playback of a media content
     * @param mediaId
     * @param userId
     */
    async shuffleMedia(mediaId: number, userId: string): Promise<SpringPlay | null> {
        const video = await playlist.shuffleMedia(mediaId, userId);
        if (video) {
            const episode = await prisma.episode.findUnique({where: {videoId: video.videoId}});
            if (episode) {
                const playback = await play.playEpisode(episode.id, userId);
                const res = await play.generatePlayback(video.videoId, userId);
                if (playback && res)
                    return {...playback, ...res, inform: false, playlistId: video.id}
            }
        }

        return null;
    }

    /**
     * @desc gets the next video in a playlist queue for playback
     * @param playlistId identifier of present video on playlist queue
     */
    async upNextPlaylist(playlistId: number): Promise<DetailedEpisode | null> {
        const next = await playlist.retrieveNextVideo(playlistId);
        if (next) {
            const video = await prisma.video.findUnique({
                where: {id: next.videoId},
                select: {media: true, episode: true}
            });
            if (video) {
                if (video.episode) {
                    const episode = await this.getEpisode(video.episode.id);
                    if (episode)
                        return {...episode, playlistId: next.id, id: video.episode.id};
                } else {
                    return {
                        overview: video.media.overview,
                        backdrop: video.media.backdrop,
                        logo: video.media.logo,
                        name: video.media.name,
                        type: MediaType.MOVIE,
                        id: video.media.id,
                        playlistId: next.id
                    }
                }
            }
        }

        return null;
    }

    /**
     * @desc attempts to a provided video from a playlist queue
     * @param playlistId identifier of present video on playlist queue
     * @param userId user identifier
     */
    async playFromPlaylist(playlistId: number, userId: string): Promise<SpringPlay | null> {
        const playVideo = await prisma.playlistVideos.findUnique({
            where: {id: playlistId},
            include: {video: {include: {episode: true}}, playlist: true}
        });
        if (playVideo) {
            const data = await this.playMedia(playVideo.video.episode?.id || playVideo.video.mediaId, userId, !!playVideo.video.episode);
            const inform = playVideo.playlist.name !== 'shuffle';
            if (data) {
                const position = inform ? data?.position : 0;
                return {...data, inform, position, playlistId: playVideo.id};
            }
        }

        return null;
    }

    /**
     * @desc plays the first video file in an playlist queue
     * @param playlistId string identifier for playlist queue
     * @param userId
     */
    async startPlaylist(playlistId: string, userId: string): Promise<SpringPlay | null> {
        const playlist = await prisma.playlistVideos.findFirst({where: {playlistId}});
        if (playlist)
            return await this.playFromPlaylist(playlist.id, userId);

        return null;
    }

    /**
     * @desc returns the name and location of the file requested
     * @param auth file identification
     */
    async getName(auth: string): Promise<{ location: string, name: string }> {
        const view = await prisma.view.findFirst({
            where: {auth},
            include: {video: {include: {media: true, episode: true}}}
        });

        if (view) {
            const location = view.video.location;
            if (view.video.media.type === MediaType.MOVIE)
                return {location, name: view.video.media.name};

            else if (view.video.episode) {
                const episode = await this.getEpisode(view.video.episode.id);
                if (episode)
                    return {
                        location,
                        name: view.video.media.name + /^Episode \d+/.test(episode.name) ? ` Season ${episode.seasonId}, Episode ${episode.episode}` : ` S${episode.seasonId}, E${episode.episode}: ${episode.name}`
                    }
            }
        }

        return {location: '', name: ''};
    }

    /**
     * @desc creates a TMDB playlist of the production company in the order at which each media was released
     * @param companyId
     * @param userId
     */
    async createProdPlaylist(companyId: string, userId: string) {
        const media: any[] = await prisma.media.findMany({
            where: {
                production: {
                    path: '$[*].name',
                    array_contains: companyId
                }
            }, select: {id: true, release: true}
        })
        const mediaIds: number[] = media.map(e => {
            e.date = new Date(e.release).getTime();
            return e;
        }).sortKey('date', true).map(e => e.id);
        const videos: any[] = await prisma.video.findMany({
            where: {
                mediaId: {in: mediaIds}
            }, include: {episode: true}
        })

        let videoIds: number[] = [];
        for (let item of mediaIds)
            videoIds = videoIds.concat(videos.filter(e => e.mediaId === item).map(e => {
                if (e.episode) {
                    e.seasonId = e.episode.seasonId;
                    e.episodeId = e.episode.episode;
                }

                return e;
            }).sortKeys('seasonId', 'episodeId', true, true).map(e => e.id));

        const identifier = await playlist.createPlaylists(videoIds, companyId, userId, Generator.FRAMES);
        const response = await playlist.findFirstVideo(identifier);
        return response?.id || null;
    }

    /**
     * @desc creates a TMDB playlist of the TMDB personality in the order at which each media was added to frames
     * @param personId
     * @param userId
     */
    async createPersonPlaylist(personId: number, userId: string) {
        const person = await this.getPersonInfo(personId) as FramesPerson;
        const mediaIds = person.production.concat(person.tv_cast).concat(person.movie_cast).sortKey('id', true).map(e => e.id);

        const videos: any[] = await prisma.video.findMany({
            where: {
                mediaId: {in: mediaIds}
            }, include: {episode: true}
        })

        let videoIds: number[] = [];
        for (let item of mediaIds)
            videoIds = videoIds.concat(videos.filter(e => e.mediaId === item).map(e => {
                if (e.episode) {
                    e.seasonId = e.episode.seasonId;
                    e.episodeId = e.episode.episode;
                }

                return e;
            }).sortKeys('seasonId', 'episodeId', true, true).map(e => e.id));

        const identifier = await playlist.createPlaylists(videoIds, person.name, userId, Generator.FRAMES);
        const response = await playlist.findFirstVideo(identifier);
        return response?.id || null;
    }

    /**
     * @param mediaId media to load for playback
     * @param userId user to be processed
     * @private a playback object lacking location
     */
    private async loadPlayer(mediaId: number, userId: string): Promise<SpringLoad | null> {
        let media = await prisma.media.findFirst({where: {id: mediaId}});
        if (media) {
            let playback = await play.playMedia(mediaId, userId);

            if (playback) {
                if (media.type === MediaType.MOVIE)
                    return {
                        mediaId,
                        videoId: playback.videoId,
                        position: playback.position,
                        overview: media.overview,
                        logo: media.logo,
                        backdrop: media.backdrop,
                        name: media.name
                    }
                else {
                    let episode = await this.getEpisode(playback.id);

                    if (episode)
                        return {
                            mediaId,
                            videoId: playback.videoId,
                            position: playback.position,
                            overview: episode.overview || media.overview,
                            logo: media.logo,
                            backdrop: media.backdrop,
                            name: media.name,
                            episodeName: /^Episode \d+/.test(episode.name) ? `${media.name}: S${episode.seasonId}, E${episode.episode}` : `S${episode.seasonId}, E${episode.episode}: ${episode.name}`
                        }
                }
            }
        }

        return null;
    }
}
