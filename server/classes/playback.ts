import Media, {SpringMedia} from "./media";
import {Episode, Media as Med, MediaType, Role, UseCase, Video} from "@prisma/client";
import {Subtitles} from "./scanner";
import {SectionPick} from "./listEditors";
import User, {Base} from "./auth";

export interface SpringLoad {
    videoId: number;
    mediaId: number;
    episodeId: number | null;
    overview: string;
    logo: string | null;
    backdrop: string;
    name: string;
    poster: string;
    playlistId: number | null;
    episodeName: string | null;
    location: string;
    inform: boolean;
    autoPlay: boolean;
    position: number;
    guest: boolean;
    playerId: string;
    cdn: string;
    activeSub: string;
    frame: boolean;
    subs: { language: string, url: string, label: string, lang: string }[],
}

export interface Sub {
    id: number;
    start: number;
    end: number;
    text: string;
    diff: number;
    style: { fontStyle: string, fontWeight: string, textDecoration: string }
}

export interface WatchHistory {
    overview: string;
    backdrop: string;
    name: string;
    watchedId: number;
    timeStamp: string;
    position: number;
    location: string;
}

export interface FrameMediaLite {
    id: number,
    poster: string,
    name: string,
    type: MediaType,
    background: string,
    logo: string | null,
    overview: string,
    backdrop: string,
    location: string,
}

export default class PlayBack extends Base {
    protected readonly mediaClass: Media;
    protected readonly scanner: Subtitles;

    constructor() {
        super();
        this.mediaClass = new Media();
        this.scanner = new Subtitles();
    }

    /**
     * @desc gets the videom information for the worker to load
     * @param auth
     */
    public async getWorkerInfo(auth: string) {
        const view = await this.prisma.view.findFirst({
            where: {auth},
            include: {video: {include: {media: true, episode: true}}}
        });

        const download = await this.prisma.download.findFirst({
            where: {location: auth},
            include: {view: {include: {video: {include: {media: true, episode: true}}}}}
        });

        if (view)
            return {location: view.video.location, download: false, name: ''};

        else if (download && (download.created.getTime() + (1000 * 60 * 60 * 2)) > Date.now()) {
            let name = download.view.video.media.name;
            if (download.view.video.episode) {
                const temp = await this.mediaClass.getEpisode(download.view.video.episode.id);
                name = temp?.name ?? name;
            }

            return {location: download.view.video.location, download: true, name};
        }

        return {location: '', download: false, name: ''};
    }

    /**
     * @desc saves the current position of the video to the database
     * @param auth - the video location identifier
     * @param userId - the user identifier
     * @param position - the current position of the video
     */
    public async saveInformation(auth: string, userId: string, position: number): Promise<void> {
        const user = await this.prisma.user.findFirst({where: {userId}});
        const view = await this.prisma.view.findFirst({
            where: {auth},
            include: {video: {include: {media: true, episode: true}}}
        });

        if (view && user && user.inform && view.inform) {
            const video = view.video;
            const episode = video.episode;
            const media = video.media;
            const watched = await this.prisma.watched.findUnique({where: {seenByUser: {userId, videoId: video.id}}});

            const seen = position > 939;
            position = position > 939 ? 1000 : position;
            const finished = seen ? 1 : 0;
            const times = seen ? (watched?.times || 0) + 1 : (watched?.times || 0);
            await this.prisma.watched.upsert({
                where: {seenByUser: {userId, videoId: video.id}},
                update: {
                    finished, times,
                    position, updated: new Date()
                },
                create: {
                    mediaId: media.id,
                    userId, videoId: video.id,
                    finished, times, position, episodeId: episode?.id,
                    created: new Date(), updated: new Date()
                }
            });

            if (seen && episode) {
                const newEpisode = await this.mediaClass.getNextEpisode(media.id, episode.id, "next");
                if (newEpisode)
                    await this.prisma.watched.upsert({
                        create: {
                            mediaId: media.id,
                            userId, videoId: newEpisode.videoId,
                            finished: 0, times: 0, position: 0, episodeId: newEpisode.id,
                            created: new Date(), updated: new Date()
                        },
                        update: {updated: new Date()},
                        where: {seenByUser: {userId, videoId: newEpisode.videoId}}
                    });

                else
                    await this.prisma.watched.updateMany({
                        where: {
                            userId, mediaId: media.id,
                        }, data: {finished: 2}
                    })
            }
        }
    }

    /**
     * @desc loads the watched information for the user
     * @param userId - the user identifier
     */
    public async getContinue(userId: string): Promise<(Pick<SpringMedia, 'backdrop' | 'logo' | 'name' | 'overview' | 'id'> & { position: number })[]> {
        const watchedList: (Pick<SpringMedia, 'backdrop' | 'logo' | 'name' | 'overview' | 'id'> & { position: number })[] = [];
        const watched = await this.prisma.watched.findMany({
            where: {userId, AND: [{position: {gte: 0}}, {position: {lte: 939}}]},
            distinct: ["mediaId"],
            include: {media: true},
            orderBy: {updated: "desc"},
            take: 12
        });

        for (const watchedItem of watched) {
            const media = await this.mediaClass.getInfoFromVideoId(watchedItem.videoId, true);
            if (media) {
                const data: (Pick<SpringMedia, 'backdrop' | 'logo' | 'name' | 'overview' | 'id'> & { location: string, position: number }) = {
                    logo: media.logo,
                    overview: media.overview,
                    backdrop: media.episodeBackdrop || media.backdrop,
                    name: watchedItem.media.name,
                    id: watchedItem.mediaId,
                    position: (watchedItem.position / 10),
                    location: media.location
                };
                watchedList.push(data);
            }
        }

        return watchedList;
    }

    /**
     * @desc Get the details of a media
     * @param id - The id of the media
     * @param userId - The id of the user
     * @param save - Whether to create a group watch link for this media
     */
    public async getMediaLite(id: number, userId: string, save: boolean): Promise<FrameMediaLite | null> {
        if (isNaN(id)) return null;

        const data = await this.prisma.media.findUnique({
            where: {id},
            include: {videos: true, episodes: {include: {video: true}, orderBy: [{seasonId: 'asc'}, {episode: 'asc'}]}}
        });

        if (data) {
            if (save) {
                const videoId = data.episodes && data.episodes.length > 0 ? data.episodes[0].videoId : data.videos.length ? data.videos[0].id : null;
                if (videoId) {
                    const playObject = await this.setPlayBack(videoId, userId, false, null);
                    if (playObject)
                        return {
                            id: data.id,
                            name: data.name,
                            logo: data.logo,
                            backdrop: data.backdrop,
                            overview: data.overview,
                            poster: data.poster,
                            type: data.type,
                            background: data.background,
                            location: playObject.location,
                        }
                }
            } else
                return {
                    id: data.id,
                    name: data.name,
                    type: data.type,
                    poster: data.poster,
                    backdrop: data.backdrop,
                    logo: data.logo,
                    background: data.background,
                    overview: data.overview,
                    location: ''
                };
        }

        return null;
    }

    /**
     * @desc generate and save suggestions for the user based on the watched list, ratings and list of the user
     * @param userId - the user identifier
     */
    public async generateSuggestions(userId: string): Promise<void> {
        const user = await this.prisma.user.findFirst({
            where: {userId},
            include: {
                watched: {include: {media: true}},
                lists: {include: {media: true}},
                ratings: {include: {media: true}},
                seen: {include: {media: true}},
                suggestions: {include: {media: true}}
            }
        });

        const appeared: Map<number, { times: number, tmdbId: number, type: MediaType }> = new Map();
        const suggestions: Map<number, { times: number, tmdbId: number, type: MediaType }> = new Map();

        if (user) {
            const watched = user.watched;
            const ratings = user.ratings;
            const lists = user.lists;
            const seen = user.seen;
            const suggestion = user.suggestions;

            if (seen.length || suggestion.length) {
                const seenItem = seen.length ? seen[0] : null;
                const suggestionItem = suggestion.length ? suggestion[0] : null;

                if (seenItem) {
                    const check = new Date(new Date(seenItem.created).getTime() + (1000 * 60 * 60 * 24)) > new Date();
                    if (check)
                        return;
                }

                if (suggestionItem) {
                    const check = new Date(new Date(suggestionItem.created).getTime() + (1000 * 60 * 60 * 24)) > new Date();
                    if (check)
                        return;
                }
            }

            for (const watchedItem of watched) {
                const val = appeared.get(watchedItem.media.id);
                if (val)
                    appeared.set(watchedItem.media.id, {
                        type: watchedItem.media.type,
                        times: val.times + watchedItem.times,
                        tmdbId: watchedItem.media.tmdbId
                    });
                else
                    appeared.set(watchedItem.media.id, {
                        type: watchedItem.media.type,
                        times: watchedItem.times,
                        tmdbId: watchedItem.media.tmdbId
                    });
            }

            for (const list of lists) {
                const val = appeared.get(list.media.id);
                if (val)
                    appeared.set(list.media.id, {
                        type: list.media.type,
                        times: val.times + 20,
                        tmdbId: list.media.tmdbId
                    });
                else
                    appeared.set(list.media.id, {type: list.media.type, times: 20, tmdbId: list.media.tmdbId});
            }

            for (const rating of ratings) {
                const val = appeared.get(rating.media.id);
                const rate = (rating.rate > 5 ? rating.rate : -rating.rate) * 2;
                if (val)
                    appeared.set(rating.media.id, {
                        type: rating.media.type,
                        times: val.times + rate,
                        tmdbId: rating.media.tmdbId
                    });
                else
                    appeared.set(rating.media.id, {type: rating.media.type, times: rate, tmdbId: rating.media.tmdbId});
            }

            const sortedDescMap = new Map([...appeared.entries()].sort((a, b) => b[1].times - a[1].times));

            for (const [_, media] of sortedDescMap) {
                const recon = await this.tmdb?.getRecommendations(media.tmdbId, media.type, 1) || [];
                const tmdbIds = recon.map(e => e.id).filter(e => e !== media.tmdbId);
                let recommendations = await this.prisma.media.findMany({
                    where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]},
                    select: {id: true, type: true, tmdbId: true}
                });

                recommendations.forEach(e => {
                    const val = suggestions.get(e.id);
                    if (val)
                        suggestions.set(e.id, {type: e.type, times: val.times + media.times, tmdbId: e.tmdbId});
                    else
                        suggestions.set(e.id, {type: e.type, times: media.times, tmdbId: e.tmdbId});
                });
            }

            const suggestedToArray = [...suggestions.entries()].sort((a, b) => b[1].times - a[1].times);
            const suggestedMediaId = suggestedToArray.map(item => item[0]);

            const seenFinished = await this.prisma.watched.findMany({
                where: {
                    OR: [
                        {
                            AND: [
                                {userId: userId},
                                {mediaId: {in: suggestedMediaId}},
                                {media: {type: MediaType.MOVIE}},
                                {position: {gte: 939}}
                            ]
                        },
                        {
                            AND: [
                                {userId: userId},
                                {mediaId: {in: suggestedMediaId}},
                                {media: {type: MediaType.SHOW}},
                                {finished: 2}
                            ]
                        }
                    ]
                },
                select: {mediaId: true}
            });

            const suggestedSeen = suggestedToArray.filter(item => seenFinished.some(e => e.mediaId === item[0])).map(x => {
                return {times: x[1].times, userId, mediaId: x[0]}
            });

            const notSeen = suggestedToArray.filter(item => !seenFinished.some(e => e.mediaId === item[0])).map(x => {
                return {times: x[1].times, userId, mediaId: x[0]}
            });

            await this.prisma.suggestion.deleteMany({where: {userId}});
            await this.prisma.suggestion.createMany({data: notSeen});

            await this.prisma.seen.deleteMany({where: {userId}});
            await this.prisma.seen.createMany({data: suggestedSeen});
        }
    }

    /**
     * @desc gets the user's recommendations
     * @param userId - the user's identifier
     */
    public async getSuggestions(userId: string): Promise<SectionPick<'BASIC'>> {
        let suggestions = await this.prisma.suggestion.findMany({where: {userId}, include: {media: true}});
        suggestions = this.randomise(suggestions, 10, 0);

        suggestions = this.sortArray(suggestions, ['times'], ['desc']);
        return {
            display: 'just for you',
            type: 'BASIC', data: suggestions.map(e => {
                const {background, id, type, name, poster} = e.media;
                return {background, id, type, name, poster}
            }) as any
        }
    }

    /**
     * @desc gets the user's seen
     * @param userId - the user's identifier
     */
    public async getSeen(userId: string): Promise<SectionPick<'BASIC'>> {
        let seen = await this.prisma.seen.findMany({where: {userId}, include: {media: true}});
        seen = this.randomise(seen, 10, 0);

        seen = this.sortArray(seen, ['times'], ['desc']);
        return {
            display: 'watch again',
            type: 'BASIC', data: seen.map(e => {
                const {background, id, type, name, poster} = e.media;
                return {background, id, type, name, poster}
            }) as any
        }
    }

    /**
     * @desc adds a file to the download queue if the auth token is valid and the auth file exists
     * @param auth - the auth location of the file
     * @param authKey - the auth token to be validated
     * @param userId - the user's identifier
     */
    public async addFileToDownload(auth: string, authKey: string, userId: string): Promise<string | null> {
        const user = new User();
        const file = await this.prisma.view.findFirst({where: {auth}, select: {video: true}});
        const userFile = await this.prisma.user.findUnique({where: {userId}});
        const valid = await user.validateAuthKey(authKey, userFile?.role || Role.USER);
        if (valid === 0 && file && userFile) {
            await user.utiliseAuthKey(authKey, userId, UseCase.DOWNLOAD, auth);
            const location = this.createUUID();
            await this.prisma.download.create({
                data: {
                    location, auth, userId
                }
            });
            return location;
        }

        return null;
    }

    /**
     * @desc gets the SRT|VTT and converts them to frames Subtitles
     * @param auth - the auth string
     * @param language - the language of the subtitles
     * @param pure - whether to return the pure subtitles or the frames
     */
    public async getSub(auth: string, language: string, pure?: boolean): Promise<Sub[] | string | null> {
        const file: { video: { [key: string]: any } } | null = await this.prisma.view.findFirst({
            where: {auth},
            select: {video: true}
        });
        if (file && file.video && file.video.hasOwnProperty(language.toLowerCase()) && file.video[language.toLowerCase()] !== null && file.video[language.toLowerCase()] !== '') {
            const sub = file.video[language.toLowerCase()];
            let res: string | null = null;
            try {
                res = await this.fetch(sub).then(res => res.text());
            } catch (e) {
                return null;
            }

            if (res) {
                if (pure) {
                    let result = '';
                    let index = 0;
                    const srt = res.replace(/^\s+|\s+$|\r+/g, '');
                    const cueList = srt.split('\n\n');
                    if (cueList.length > 0) {
                        result += "WEBVTT\n\n";
                        while (index < cueList.length) {
                            const caption = cueList[index];
                            let cue = "";
                            const s = caption.split(/\n/);
                            while (s.length > 3) {
                                for (let i = 3; i < s.length; i++) {
                                    s[2] += "\n" + s[i]
                                }
                                s.splice(3, s.length - 3);
                            }

                            let line = 0;
                            if (!s[0]?.match(/\d+:\d+:\d+/) && s[1]?.match(/\d+:\d+:\d+/)) {
                                cue += s[0].match(/\w+/) + "\n";
                                line++;
                            }

                            if (s[line].match(/\d+:\d+:\d+/)) {
                                const m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
                                if (m) {
                                    cue += m[1] + ":" + m[2] + ":" + m[3] + "." + m[4] + " --> "
                                        + m[5] + ":" + m[6] + ":" + m[7] + "." + m[8] + "\n";
                                    line += 1;

                                } else return "";
                            } else return "";
                            if (s[line])
                                cue += s[line] + "\n\n";

                            result += cue;
                            index++;
                        }
                    }

                    return result;

                } else {
                    res = res.replace(/\r\n|\r|\n/g, '\n');
                    const subtitle: Sub[] = [];
                    const sections = res.split('\n\n');
                    for (let item of sections) {
                        let section = item.split('\n');
                        if (section.length > 2) {
                            const id = +(section[0]);
                            const range = section[1].split(' --> ');
                            if (range.length > 1) {
                                const start = this.parseTime(range[0]);
                                const end = this.parseTime(range[1]);
                                const diff = end - start;
                                let text = section.slice(2).join(' ');
                                if (/<font/i.test(text))
                                    continue;

                                const italic = !!text.match(/\b(?:[iI]\b|\b[iI]\b)/g);
                                const bold = !!text.match(/\b(?:[bB]\b|\b[bB]\b)/g);
                                const underline = !!text.match(/\b(?:[uU]\b|\b[uU]\b)/g);
                                text = text.replace(/<\/\w+>|<\w+>/g, '');
                                const style = {
                                    fontStyle: italic ? 'italic' : 'normal',
                                    fontWeight: bold ? 'bold' : 'normal',
                                    textDecoration: underline ? 'underline' : 'none'
                                };
                                subtitle.push({id, start, end, diff, text, style});
                            }
                        }
                    }

                    return subtitle;
                }
            }
        }

        return null;
    }

    /**
     * @desc gets the next episode for playback based on user's activity
     * @param mediaId - the media id
     * @param userId - the user id
     * @protected
     */
    protected async getNextEpisodeForUser(mediaId: number, userId: string): Promise<{ episode: Episode, position: number } | null> {
        const watched = await this.prisma.watched.findMany({where: {userId, mediaId}, orderBy: {updated: 'desc'}});
        if (watched.length > 0) {
            if (watched[0].episodeId) {
                if (watched[0].position > 939) {
                    const firstEpisode = await this.mediaClass.getNextEpisode(mediaId, watched[0].episodeId, 'first');
                    const nextEpisode = await this.mediaClass.getNextEpisode(mediaId, watched[0].episodeId, 'next');
                    if (nextEpisode)
                        return {episode: nextEpisode, position: 0};

                    else if (firstEpisode) {
                        const episode = await this.prisma.episode.findMany({where: {showId: mediaId}});
                        const notWatched = episode.filter(e => watched.every(w => w.episodeId !== e.id));
                        const data = notWatched.map(e => {
                            return {
                                userId, mediaId,
                                videoId: e.videoId,
                                position: 1000,
                                episodeId: e.id,
                                finished: 2,
                                times: 1,
                                updated: new Date()
                            }
                        })

                        await this.prisma.watched.createMany({data});
                        await this.prisma.watched.updateMany({
                            where: {userId, mediaId, times: {lt: 1}},
                            data: {times: 1, finished: 2}
                        })
                        return {episode: firstEpisode, position: 0};
                    }

                } else {
                    const episode = await this.prisma.episode.findUnique({where: {id: watched[0].episodeId}});
                    if (episode)
                        return {episode, position: watched[0].position};
                }
            }

        } else {
            const episode = await this.mediaClass.getNextEpisode(mediaId, 0, 'first');
            if (episode)
                return {episode, position: 0};
        }

        return null;
    }

    /**
     * @desc gets the next videoId to be used based on the user's seen
     * @param videoId - the current video identifier
     * @param userId - the user's identifier
     */
    public async getNextVideoId(videoId: number, userId: string): Promise<number | null> {
        const video = await this.prisma.video.findUnique({
            where: {
                id: videoId
            }, include: {media: {include: {episodes: true}}, episode: true}
        });

        if (video) {
            const media = video.media;
            if (media.type === MediaType.MOVIE) {
                if (media.collection) {
                    const col = media.collection as any as { id: number };
                    const collections = await this.prisma.media.findMany({
                        where: {
                            AND: [
                                {
                                    collection: {
                                        path: ['id'],
                                        equals: col.id
                                    }
                                },
                            ]
                        }, orderBy: {release: 'asc'},
                        include: {videos: true}
                    });

                    const medIndex = collections.findIndex(m => m.id === media.id);
                    const next = medIndex !== -1 && medIndex + 1 < collections.length ? collections[medIndex + 1] : null;
                    if (next)
                        return next.videos[0].id;
                }
            } else if (video.episode) {
                const nextEpisode = await this.mediaClass.getNextEpisode(video.media.id, video.episode.id, 'next');
                if (nextEpisode)
                    return nextEpisode.videoId;
            }

            const recommended = await this.tmdb?.getRecommendations(media.tmdbId, media.type);
            if (recommended?.length) {
                const tmdbIds = recommended.map(item => item.id).filter(id => id !== video.media.tmdbId);
                const med = await this.prisma.media.findMany({
                    where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]},
                    include: {videos: true}
                });
                if (med.length) {
                    const next = med[Math.floor(Math.random() * med.length)];
                    if (next.type === MediaType.MOVIE)
                        return next.videos[0].id;

                    const nextEpisode = await this.getNextEpisodeForUser(next.id, userId);
                    if (nextEpisode)
                        return nextEpisode.episode.videoId;
                }
            }

            const randoms = await this.prisma.media.findMany({
                where: {AND: [{type: media.type}, {NOT: {id: media.id}}]},
                orderBy: {release: 'asc'},
                include: {videos: true}
            });

            const random = randoms[Math.floor(Math.random() * randoms.length)];
            if (random && random.type === MediaType.MOVIE)
                return random.videos[0].id;

            const nextEpisode = await this.getNextEpisodeForUser(random.id, userId);
            if (nextEpisode)
                return nextEpisode.episode.videoId;
        }

        return null;
    }

    /**
     * @desc Get the current playing media information using the current auth
     * @param auth - The auth object
     * @param userId - The user identifier
     * @param inform - If the database should be informed about the current playing media
     */
    public async getPlayBack(auth: string, userId: string, inform: boolean): Promise<SpringLoad | null> {
        const videoRes = await this.prisma.view.findFirst({
            where: {auth},
            include: {episode: true, video: {include: {media: true}}}
        });

        if (videoRes) {
            const {episode, video} = videoRes;
            return await this.handlePlayBackCreation(video, userId, videoRes.playlistId, episode, inform && videoRes.inform);
        }

        return null;
    }

    public async getBrowse(data: { genres: string[], decade: string, mediaType: MediaType }, page: number, userId: string) {
        const {genres, decade, mediaType} = data;
        let media: Med[] = [];

        if (genres.length === 0 && decade === '') {
            const data = await this.prisma.suggestion.findMany({
                where: {userId}, include: {media: true}, orderBy: {times: 'desc'},
                skip: (page - 1) * 100, take: 100
            })

            media = data.map(item => item.media).filter(item => item.type === mediaType);
        } else if (genres.length > 0 && decade !== '') {
            const newDecade = +decade.replace('s', '');
            const decadeStart = new Date(newDecade, 0, 1);
            const decadeEnd = new Date(newDecade + 10, 0, 1);
            const data = genres.reduce((acc, genre) => genre + ' & ' + acc, '').replace(/\s&\s$/, '');

            media = await this.prisma.media.findMany({
                where: {
                    AND: [
                        {type: mediaType},
                        {release: {gt: decadeStart}},
                        {release: {lte: decadeEnd}},
                        // @ts-ignore
                        {genre: {search: data}}
                    ]
                },
                skip: (page - 1) * 100,
                take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });
        } else if (genres.length > 0 && decade === '') {
            const data = genres.reduce((acc, genre) => genre + ' & ' + acc, '').replace(/\s&\s$/, '');
            media = await this.prisma.media.findMany({
                where: {
                    AND: [
                        {type: mediaType},
                        // @ts-ignore
                        {genre: {search: data}}
                    ]
                },
                skip: (page - 1) * 100,
                take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });

        } else {
            const newDecade = +decade.replace('s', '');
            const decadeStart = new Date(newDecade, 0, 1);
            const decadeEnd = new Date(newDecade + 10, 0, 1);
            media = await this.prisma.media.findMany({
                where: {
                    AND: [
                        {type: mediaType},
                        {release: {gt: decadeStart}},
                        {release: {lte: decadeEnd}}
                    ]
                },
                skip: (page - 1) * 100,
                take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });
        }

        const newData: Pick<Med, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[] = media.map(item => {
            let {id, type, backdrop, logo, name, genre, release} = item;
            release = release || new Date();
            return {id, type, backdrop, logo, name, genre, release};
        });

        return newData;
    }

    /**
     * @desc Get the current playing media information using the current auth
     * @param videoId - The video identifier
     * @param userId - The user identifier
     * @param inform - Whether to inform the user
     * @param playlistId - The playlist video identifier
     */
    protected async setPlayBack(videoId: number, userId: string, inform: boolean, playlistId: number | null): Promise<SpringLoad | null> {
        const episode = await this.prisma.episode.findFirst({where: {videoId}});
        const video = await this.prisma.video.findFirst({where: {id: videoId}, include: {media: true}});

        if (video)
            return await this.handlePlayBackCreation(video, userId, playlistId, episode, inform);

        return null;
    }

    /**
     * @desc Handle the creation of the play back information
     * @param video - The video object
     * @param userId - The user identifier
     * @param playlistId - The playlist video identifier
     * @param episode - The episode object
     * @param inform - The inform? variable
     */
    private async handlePlayBackCreation(video: (Video & { media: Med }), userId: string, playlistId: number | null, episode: Episode | null, inform: boolean): Promise<SpringLoad | null> {
        const {media, english, french, german} = video;
        let episodeName: string | null = null;
        let location = this.createUUID();

        let {overview, backdrop, poster, logo, name} = media;
        if (episode) {
            const episodeInfo = await this.mediaClass.getEpisode(episode.id);
            if (episodeInfo) {
                overview = episodeInfo.overview || overview;
                episodeName = episodeInfo.name;
            }
        }

        let subs = [];
        if (!english && !french && !german)
            subs = await this.scanner.getSub({...video, episode}, location);

        else {
            if (english)
                subs.push({
                    language: 'English',
                    url: '/api/stream/subtitles?auth=' + location + '&language=english',
                    label: 'English',
                    lang: 'en'
                });

            if (french)
                subs.push({
                    language: 'French',
                    url: '/api/stream/subtitles?auth=' + location + '&language=french',
                    label: 'Français',
                    lang: 'fr'
                });

            if (german)
                subs.push({
                    language: 'German',
                    url: '/api/stream/subtitles?auth=' + location + '&language=german',
                    label: 'Deutsch',
                    lang: 'de'
                });
        }

        const user = await this.prisma.user.findFirst({where: {userId}});
        if (user) {
            inform = user.inform ? inform : false;
            const obj = {
                inform,
                playlistId,
                videoId: video.id,
                episodeId: episode?.id,
                auth: location, userId,
                created: new Date(),
                updated: new Date(),
            };

            const watched = await this.prisma.watched.findUnique({where: {seenByUser: {userId, videoId: video.id}}});

            await this.prisma.view.upsert({
                where: {auth: location},
                update: obj,
                create: obj
            });

            return {
                playlistId,
                videoId: video.id,
                mediaId: media.id,
                episodeId: episode?.id || null,
                autoPlay: user.autoplay,
                playerId: this.createUUID(), frame: false,
                location, inform, overview, activeSub: user.defaultLang,
                logo, backdrop, name, poster, cdn: this.regrouped.user?.cdn || '/api/streamVideo?auth=',
                position: inform ? (watched?.position || 0) > 939 ? 0 : (watched?.position || 0) : 0,
                episodeName, subs, guest: user.role === Role.GUEST
            };
        }

        return null;
    }
}