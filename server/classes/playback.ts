import {MediaType, Role} from "@prisma/client";
import {create_UUID, parseTime} from "../base/baseFunctions";
import {pageTwo} from "../base/tmdb_hook";
import Episode from "./episode";
import {drive, prisma} from '../base/utils';
import environment from "../base/env";
import {NextApiRequest, NextApiResponse} from "next";
import got from "got";
import {MediaSection} from "./media";
import {SpringLoad} from "./springboard";
import {Subtitles as SubClass} from "./update";

export interface VideoPos {
    position: number;
    id: number;
    videoId: number;
    mediaId?: number;
    found: boolean;
}

export interface SectionInterface {
    data: MediaSection[];
    display: string,
    type: string
}

export interface Sub {
    id: number;
    start: number;
    end: number;
    text: string;
    diff: number;
}

export type Subtitles = Sub[];

export interface UpNextHolder {
    backdrop: string;
    logo: string;
    overview: string;
    name: string;
    mediaId: number;
    episodeName?: string;
}

export default class Playback {

    /**
     * @param mediaId media to be processed
     * @param userId user for which media is being processed
     * @returns the next sequential episode for playback
     */
    async getNextEpisode(mediaId: number, userId: string): Promise<VideoPos | null> {
        let media = await prisma.media.findFirst({
            where: {id: mediaId},
            include: {episodes: true}
        });

        if (media && media.type === MediaType.SHOW) {
            let episodes = media.episodes;
            episodes = episodes.sortKeys("seasonId", "episode", true, true);
            let result = await prisma.view.findMany({
                where: {
                    userId,
                    episode: {showId: mediaId},
                    position: {gt: 0}
                }, include: {episode: true},
                orderBy: [{updated: 'desc'}, {position: 'desc'}]
            })

            if (result.length) {
                const seen = result.some(e => e.finished === 2);

                if (seen) {
                    const sortSeen = result.map(e => {
                        return {
                            id: e.episode!.id,
                            seasonId: e.episode!.seasonId,
                            episode: e.episode!.episode
                        }
                    }).sortKeys("seasonId", "episode", true, true);
                    const lastWatched = sortSeen.length ? sortSeen[sortSeen.length - 1] : null;

                    if (lastWatched && lastWatched.id !== episodes[episodes.length - 1].id) {
                        const unseen = result.filterInFilter(episodes, 'videoId', 'videoId');
                        const episode = unseen.find(e => {
                            return e.seasonId === lastWatched.seasonId && e.episode > lastWatched.episode || e.seasonId > lastWatched.seasonId;
                        })

                        if (episode) {
                            await prisma.view.updateMany({
                                where: {
                                    userId,
                                    video: {mediaId}
                                }, data: {finished: 1}
                            })

                            return {
                                position: 0,
                                id: episode.id,
                                videoId: episode.videoId,
                                found: true,
                            };
                        }
                    }
                }

                let lastSeen = result[0];
                if (lastSeen.finished === 0) {
                    return {
                        position: lastSeen.position,
                        id: lastSeen.episodeId!,
                        videoId: lastSeen.videoId,
                        found: true,
                    };
                } else {
                    let lastSeenIndex = episodes.findIndex(item => item.id === lastSeen.episodeId);
                    let nextEpisode = lastSeenIndex >= 0 && lastSeenIndex < episodes.length - 2 ? episodes[lastSeenIndex + 1] : null;
                    if (nextEpisode && lastSeen.finished !== 2) {
                        let video = result.find(e => e.episodeId === nextEpisode!.id)

                        return {
                            position: video && video.position < 920 ? video.position : 0,
                            id: nextEpisode.id,
                            videoId: nextEpisode.videoId,
                            found: true,
                        };
                    }
                }
            }

            if (episodes.length)
                return {
                    position: 0,
                    id: episodes[0].id,
                    videoId: episodes[0].videoId,
                    found: false,
                };
        }

        return null;
    }

    /**
     * @description generates and saves an auth instance in view
     * @param videoId video to be played
     * @param userId user identifier
     * @returns auth identifier uuid string
     */
    async generatePlayback(videoId: number, userId: string): Promise<{ frame: boolean, guest: boolean, inform: boolean, location: string, subs: { language: string, url: string }[], cdn: string } | null> {
        const subtitle = new SubClass();
        let video: { [p: string]: any } | null = await prisma.video.findFirst({where: {id: videoId}});
        let user = await prisma.user.findFirst({where: {userId}});
        let episode = await prisma.episode.findFirst({where: {videoId}})
        if (video && user) {
            let obj = {
                auth: create_UUID(), created: new Date(),
                userId, position: 0, videoId, updated: new Date(),
                episodeId: episode ? episode.id : null, finished: 0
            };

            let tempSubs = ['english', 'french', 'german'].map(e => {
                if (video && video.hasOwnProperty(e) && video[e] !== null && video[e] !== '')
                    return {
                        language: e,
                        url: '/api/stream/subtitles?auth=' + obj.auth + '&language=' + e
                    }
            })

            const subs: { language: string, url: string }[] = [];
            for (let item of tempSubs) {
                if (item !== undefined)
                    subs.push(item);
            }

            let info = await prisma.view.create({data: obj});
            if (subs.length < 1)
                await subtitle.getSub(videoId);

            return {
                frame: false,
                inform: true,
                location: info.auth,
                subs,
                cdn: environment.config.cdn,
                guest: user.role === Role.GUEST
            };
        }

        return null;
    }

    /**
     * VideoPos {found, position, id}
     * @param mediaId media to be processed
     * @param userId user for which media is being processed
     * @returns the information necessary for playback
     */
    async playMedia(mediaId: number, userId: string): Promise<VideoPos | null> {
        let media = await prisma.media.findFirst({where: {id: mediaId}})
        if (media && media.type === MediaType.MOVIE) {
            let video = await prisma.video.findMany({
                include: {views: {where: {position: {gt: 0}}}},
                where: {mediaId, views: {some: {userId}}}
            });

            if (video.length) {
                let view = video[0].views.filter(e => e.userId === userId).sortKey('updated', false)[0];
                return {
                    position: view && view.position < 920 ? view.position : 0,
                    id: mediaId,
                    videoId: video[0].id,
                    found: true
                }
            } else {
                let video = await prisma.video.findMany({where: {mediaId}});
                if (video.length)
                    return {
                        id: mediaId,
                        videoId: video[0].id,
                        position: 0,
                        found: false
                    }
            }
        } else return await this.getNextEpisode(mediaId, userId);
        return null
    }

    /**
     * @desc preps an episode for playback
     * @param episodeId
     * @param userId
     */
    async playEpisode(episodeId: number, userId: string): Promise<SpringLoad | null> {
        const episodeClass = new Episode();
        const info = await episodeClass.getEpisode(episodeId);
        const episode = await prisma.episode.findFirst({where: {id: episodeId}, select: {media: true, video: true}});
        let views = await prisma.view.findMany({
            where: {userId, episodeId, position: {gt: 0}},
            orderBy: [{updated: 'desc'}, {position: 'desc'}]
        });
        if (episode && info) {
            const view = views.length ? views[0] : null;
            return {
                mediaId: episode.media.id,
                videoId: episode.video.id,
                position: view && view.position < 920 ? view.position : 0,
                logo: episode.media.logo,
                backdrop: episode.media.backdrop,
                episodeName: /^Episode \d+/.test(info.name) ? `${episode.media.name}: S${info.seasonId}, E${info.episode}` : `S${info.seasonId}, E${info.episode}: ${info.name}`,
                name: episode.media.name, overview: info.overview || episode.media.poster, poster: episode.media.poster,
            };
        }

        return null;
    }

    /**
     * @description suggests media for the user to rewatch
     * @param userId user to be processed
     * @returns returns seen for specific user
     */
    async getSeen(userId: string): Promise<SectionInterface> {
        let seen = await prisma.seen.findMany({where: {userId}, include: {media: true}});
        let database: MediaSection[] = seen.map(item => {
            return {
                id: item.media.id,
                background: item.media.background,
                tmdbId: item.media.tmdbId,
                type: item.media.type,
                poster: item.media.poster,
                name: item.media.name,
                rep: item.rep
            }
        })
        let movie = database.randomiseDB(7, 0, MediaType.MOVIE);
        let shows = database.randomiseDB(5, 0, MediaType.SHOW);
        return {data: movie.concat(shows).sortKey('rep', false), display: 'watch again', type: 'basic'};
    }

    /**
     * @description processes the user's activity to offer suggestions for them to see or watch again
     * @param userId user to be processed
     */
    async loadSuggestion(userId: string) {
        const seen = await prisma.seen.findFirst({where: {userId}});
        const suggest = await prisma.suggestion.findFirst({where: {userId}});

        if (seen || suggest) {
            if (seen) {
                const check = new Date(new Date(seen.created).getTime() + (1000 * 60 * 60 * 24)) > new Date();
                if (check)
                    return;
            }

            if (suggest) {
                const check = new Date(new Date(suggest.created).getTime() + (1000 * 60 * 60 * 24)) > new Date();
                if (check)
                    return;
            }
        }

        let user = await prisma.user.findFirst({
            where: {userId},
            include: {views: {include: {video: {include: {episode: true}}}}, lists: true, ratings: true}
        });

        if (user) {
            let database = await prisma.media.findMany();
            let medias: Array<{ mediaId: number, rep: number }> = [];
            let response: Array<{ userId: string, mediaId: number, rep: number }> = [];
            let ratings = user.ratings;
            let views = user.views;
            let list = user.lists;

            for (let item of ratings) {
                let media = medias.find(e => e.mediaId === item.mediaId);
                if (media) {
                    media.rep += item.rate > 5 ? item.rate : -item.rate;
                } else {
                    medias.push({
                        mediaId: item.mediaId,
                        rep: item.rate > 5 ? item.rate : -item.rate
                    })
                }
            }

            for (let item of list) {
                let media = medias.find(e => e.mediaId === item.mediaId);
                if (media) {
                    media.rep += 20;
                } else {
                    medias.push({
                        mediaId: item.mediaId,
                        rep: 20
                    })
                }
            }

            for (let item of views) {
                let media = medias.find(e => e.mediaId === item.video.mediaId);
                if (media) {
                    media.rep += Math.ceil((item.position / 100));
                } else {
                    medias.push({
                        mediaId: item.video.mediaId,
                        rep: Math.ceil((item.position / 100))
                    })
                }
            }

            medias = medias.filter(e => e.rep > 10).sortKey('rep', false);

            for (let loki of medias) {
                let media = database.find(e => e.id === loki.mediaId);
                if (media) {
                    let recommendations = await pageTwo(media.type, media.tmdbId, database, 1, 2, false);
                    for (let item of recommendations) {
                        let temp = response.find(e => e.mediaId === item.id);
                        if (temp)
                            temp.rep += loki.rep;
                        else
                            response.push({
                                mediaId: item.id,
                                userId, rep: loki.rep
                            })
                    }
                }
            }

            let seen = [];
            let suggestions = [];
            for (let item of response) {
                let res = views.find(e => e.video.mediaId === item.mediaId)
                if (res && ((res.finished === 2) || (res.finished === 1 && res.video.episode === null))) {
                    seen.push({
                        rep: item.rep,
                        userId, mediaId: item.mediaId,
                        created: new Date(), updated: new Date
                    })
                } else if (res === undefined) {
                    suggestions.push({
                        rep: item.rep,
                        userId, mediaId: item.mediaId,
                        created: new Date()
                    })
                }
            }

            await prisma.seen.deleteMany({where: {userId}});
            await prisma.suggestion.deleteMany({where: {userId}});

            await prisma.seen.createMany({data: seen});
            await prisma.suggestion.createMany({data: suggestions});
        }
    }

    /**
     * @param userId user to be processed
     * @returns the suggestions of a specific user
     */
    async getSuggestions(userId: string): Promise<SectionInterface> {
        let data = await prisma.suggestion.findMany({where: {userId}, include: {media: true}});
        let info: MediaSection [] = data.map(item => {
            return {
                rep: item.rep, background: item.media.background,
                id: item.mediaId, name: item.media.name,
                type: item.media.type, poster: item.media.poster
            }
        });

        let movies = info.randomiseDB(7, 0, MediaType.MOVIE);
        let shows = info.randomiseDB(5, 0, MediaType.SHOW);

        info = movies.concat(shows).sortKey('rep', false);
        return {display: 'just for you', data: info, type: 'basic'}
    }

    /**
     * @desc gets the videos the user has seen but not finished so they can continue watching
     * @param userId
     */
    async getContinue(userId: string): Promise<SectionInterface> {
        let info = await prisma.view.findMany({
            where: {userId, position: {gt: 0}},
            include: {video: {include: {media: true}}},
            orderBy: [{updated: 'desc'}]
        });
        let data = info.map(e => {
            return {
                finished: e.finished,
                backdrop: e.video.media.backdrop,
                name: e.video.media.name, logo: e.video.media.logo,
                type: e.video.media.type, id: e.video.media.id, position: e.position
            }
        }).uniqueID('id').filter(e => (e.position < 919 && e.type === MediaType.MOVIE) || (e.type === MediaType.SHOW && e.finished !== 2))
            .slice(0, 12).map(e => {
                return {
                    position: e.position,
                    backdrop: e.backdrop, name: e.name,
                    type: e.type, logo: e.logo, id: e.id
                }
            });

        let episode = new Episode();
        let result: MediaSection[] = [];
        for await (let item of data) {
            if (item.type === MediaType.SHOW) {
                let e = await this.getNextEpisode(item.id, userId);
                if (e && e.found) {
                    let f = await episode.getEpisode(e!.id);
                    item.position = e.position;
                    item.backdrop = f?.backdrop || item.backdrop;
                    result.push(item);
                }

            } else if (item.type === MediaType.MOVIE)
                result.push(item);
        }

        return {display: 'continue watching', data: result, type: 'editor'};
    }

    /**
     * @desc updates the position information as user streams through the file
     * @param userId
     * @param auth
     * @param position
     */
    async updateStreamInformation(userId: string, auth: string, position: number): Promise<boolean> {
        position = Math.ceil(position);
        const file = await prisma.view.findFirst({
            where: {auth, userId},
            include: {video: {include: {media: {include: {episodes: true}}}}}
        });

        if (file && position < 1001) {
            if (position < 920)
                await prisma.view.update({where: {id: file.id}, data: {finished: 0, position}});

            else if (file.video.media.type === MediaType.MOVIE)
                await prisma.view.update({where: {id: file.id}, data: {finished: 1, position}});

            else if (file.episodeId && file.video.media.episodes) {
                const episodes = file.video.media.episodes.sortKeys("seasonId", "episode", true, true);
                if (episodes.length) {
                    const finished = episodes[episodes.length - 1].id === file.episodeId ? 2 : 1;
                    await prisma.view.update({where: {id: file.id}, data: {finished, position}});
                    if (finished === 2)
                        await prisma.view.updateMany({
                            where: {
                                userId,
                                video: {mediaId: file.video.media.id}
                            }, data: {finished}
                        })
                }
            }

            return true;
        }

        return false;
    }

    /**
     * @desc finds media to play by their auth
     * @param auth
     * @param userId
     */
    async findByAuth(auth: string, userId: string): Promise<VideoPos | null> {
        let views = await prisma.view.findFirst({
            where: {auth},
            select: {video: true, videoId: true, episodeId: true, position: true}
        });
        if (views) {
            let position: any = views.position;
            let video = views.episodeId ? await prisma.video.findMany({
                include: {views: {where: {position: {gt: 0}}}},
                where: {mediaId: views.video.mediaId, views: {some: {userId, episodeId: views.episodeId}}}
            }) : await prisma.video.findMany({
                include: {views: {where: {position: {gt: 0}}}},
                where: {mediaId: views.video.mediaId, views: {some: {userId}}}
            });

            if (video.length) {
                let view = video[0].views.sortKey('updated', false)[0];
                position = view ? view.position : position;
            }

            return {
                videoId: views.videoId,
                id: views.episodeId ? views.episodeId : views.video.mediaId,
                mediaId: views.video.mediaId,
                position: position > 920 ? 0 : position,
                found: true
            }
        }

        return null;
    }

    /**
     * @desc attempts to stream a video to the client, this doesn't work on SAAS infrastructures like Vercel
     * @param auth
     * @param req
     * @param res
     */
    async playFile(auth: string, req: NextApiRequest, res: NextApiResponse) {
        if (req.headers.range) {
            const file = await prisma.view.findFirst({where: {auth}, select: {video: true}});
            if (file)
                await drive.streamFile(file.video.location, res, req.headers.range);

            else
                res.status(404).json('file not found');

        } else res.status(400).json('no range provided');
    }

    /**
     * @desc gets the SRT|VTT and converts them to frames Subtitles
     * @param auth
     * @param language
     */
    async getSub(auth: string, language: string): Promise<Subtitles | null> {
        const file: { video: { [key: string]: any } } | null = await prisma.view.findFirst({
            where: {auth},
            select: {video: true}
        });
        if (file && file.video && file.video.hasOwnProperty(language) && file.video[language] !== null && file.video[language] !== '') {
            const sub = file.video[language];
            let res: string | null = null;
            try {
                const data = await got(sub)
                res = data.body;
            } catch (e) {
                return null;
            }

            if (res) {
                res = res.replace(/\r\n|\r|\n/g, '\n');
                const subtitle: Subtitles = [];
                const sections = res.split('\n\n');
                for (let item of sections) {
                    let section = item.split('\n');
                    if (section.length > 2) {
                        const id = +(section[0]);
                        const range = section[1].split(' --> ');
                        if (range.length > 1) {
                            const start = parseTime(range[0]);
                            const end = parseTime(range[1]);
                            const diff = end - start;
                            const text = section.slice(2).join(' ');
                            subtitle.push({id, start, end, diff, text});
                        }
                    }
                }

                return subtitle;
            }
        }

        return null;
    }

    /**
     * @desc returns the backdrop of a video to be played
     * @param mediaId
     * @param episodeBool
     */
    async getNextHolder(mediaId: number, episodeBool = false): Promise<UpNextHolder | null> {
        if (episodeBool) {
            const file = await prisma.episode.findFirst({where: {id: mediaId}, select: {media: true}});
            if (file) {
                const episode = new Episode();
                const episodeInfo = await episode.getEpisode(mediaId);
                if (episodeInfo)
                    return {
                        mediaId: file.media.id,
                        name: file.media.name,
                        overview: episodeInfo.overview || file.media.overview,
                        logo: file.media.logo,
                        episodeName: /^Episode \d+/.test(episodeInfo.name) ? `${file.media.name}: S${episodeInfo.seasonId}, E${episodeInfo.episode}` : `S${episodeInfo.seasonId}, E${episodeInfo.episode}: ${episodeInfo.name}`,
                        backdrop: file.media.backdrop,
                    }
            }

        }

        const file = await prisma.media.findFirst({where: {id: mediaId}});
        if (file) {
            const {name, logo, backdrop, overview} = file;
            return {name, logo, backdrop, overview, mediaId};
        }

        return null;
    }
}