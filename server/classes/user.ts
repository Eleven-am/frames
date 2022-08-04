import {Episode, Media, MediaType, Role} from "@prisma/client";
import {Base} from "./auth";
import {WatchHistory} from "./playback";
import MediaClass, {SpringMedia} from "./media";

export interface PlaybackSettings {
    defaultLang: string;
    autoplay: boolean;
    inform: boolean;
}

export interface WatchHistoryResult {
    pages: number;
    page: number;
    results: WatchHistory[];
}

export interface NotificationInterface {
    type: string;
    title: string;
    message: string;
    opened: boolean;
    sender: string;
    recipient?: string;
    data: any;
}

export interface MessageInterface {
    title: string;
    message: string;
    sender: string;
    receiver: string;
    seen: boolean;
    sent: string;
}

export interface MyList {
    overview: string;
    backdrop: string;
    name: string;
    timeStamp: string;
    logo: string | null;
    id: number;
    location: string;
    poster: string;
    type: MediaType;
    background: string;
}

export interface SpringMedUserSpecifics {
    myList: boolean;
    seen: boolean;
    rating: string;
    favorite: boolean;
    download: boolean;
    canEdit: boolean;
}

export default class User extends Base {
    protected readonly media: MediaClass;

    constructor() {
        super();
        this.media = new MediaClass();
    }

    /**
     * @desc checks if the user is admin
     * @param userId - id of the user
     */
    public async isAdmin(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) return user.role === Role.ADMIN;

        return false;
    }

    /**
     * @desc sets rate value on a media for a user
     * @param mediaId - media identifier to be rated
     * @param userId - user identifier
     * @param rate - rate value
     */
    public async rateThis(mediaId: number, userId: string, rate: number): Promise<boolean> {
        let list = await this.prisma.rating.findFirst({where: {userId, mediaId}});
        if (list) await this.prisma.rating.update({where: {id: list.id,}, data: {rate}})

        else await this.prisma.rating.create({data: {mediaId, userId, rate}})

        return true;
    }

    /**
     * @desc modify a user's playback details
     * @param userId - userId of the user
     * @param settings - settings to be modified
     */
    public async modifyUserPlaybackSettings(userId: string, settings: PlaybackSettings) {
        const data = this.prisma.user.update({
            where: {userId}, data: {...settings}
        })

        return !!data;
    }

    /**
     * @desc gets the user's playback settings
     * @param userId - user identifier
     */
    public async getUserPlaybackSettings(userId: string): Promise<PlaybackSettings> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) return {defaultLang: user.defaultLang, autoplay: user.autoplay, inform: user.inform};

        return {defaultLang: 'en', autoplay: false, inform: false};
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
        if (page > pages) return {pages, page, results: []};

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
                name,
                backdrop: e.episode?.backdrop || e.media.backdrop,
                position: e.position > 939 ? 100 : e.position / 10,
                watchedId: e.id,
                timeStamp: this.compareDates(e.updated),
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
    public async getMyList(userId: string, page?: number, limit?: number): Promise<{ results: MyList[], pages: number, page: number }> {
        if (page && limit) {
            const total = await this.prisma.listItem.count({where: {userId}});
            const pages = Math.ceil(total / limit);

            if (page > pages) return {results: [], pages, page};

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
                    id: list.id,
                    poster: list.poster,
                    type: list.type,
                    background: list.background,
                }
            });

            return {results: data, pages, page};

        } else {
            const myList = await this.prisma.listItem.findMany({
                where: {userId}, include: {media: true}, orderBy: {updated: 'desc'}
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
                    id: list.id,
                    poster: list.poster,
                    type: list.type,
                    background: list.background,
                }
            });

            return {results: data, pages: 1, page: 1};
        }
    }

    /**
     * @desc attempts to add media to user's list if absent or deletes if present
     * @param mediaId - media identifier
     * @param userId - user identifier
     * @returns true if added false if removes
     */
    public async addToList(mediaId: number, userId: string): Promise<boolean> {
        let media = await this.prisma.media.findFirst({where: {id: mediaId}});
        let list = await this.prisma.listItem.findFirst({where: {mediaId, userId}});
        if (media) {
            if (list) {
                await this.prisma.listItem.delete({where: {id: list.id}});
                return false;

            } else {
                await this.prisma.listItem.create({
                    data: {
                        mediaId, userId, created: new Date(), updated: new Date()
                    }
                });
                return true;
            }

        }

        return false;
    }

    /**
     * @desc gets the details of a specific media related to a user in the database
     * @param mediaId - the id of the media to query the database for
     * @param userId - the id of the user to query the database for
     */
    public async getSpecificMediaInfo(mediaId: number, userId: string): Promise<SpringMedUserSpecifics | null> {
        const media = await this.prisma.media.findUnique({where: {id: mediaId}});
        const user = await this.prisma.user.findUnique({
            where: {userId}, include: {lists: true, ratings: true, watched: true}
        });

        if (media && user) {
            const myList = user.lists.some(item => item.mediaId === mediaId);
            let rating = ((user.ratings.find(item => item.mediaId === mediaId)?.rate || 0) * 10).toFixed(0);
            rating = rating === '0' ? '5%' : rating + '%';

            const seenData = await this.checkIfSeen(userId, mediaId);
            const seen = seenData === null ? false : seenData;

            const canEdit = user.role === Role.ADMIN;
            const download = canEdit && media.type === MediaType.SHOW;
            const favorite = false;

            return {seen, myList, rating, download, favorite, canEdit};
        }

        return null;
    }

    /**
     * @desc changes the default subtitle language for a user
     * @param userId - the user requesting the change
     * @param sub - the new subtitle language
     */
    public async modifyUserDefaultSub(userId: string, sub: string) {
        try {
            await this.prisma.user.update({
                where: {userId}, data: {defaultLang: sub}
            });
            return true;
        } catch (e) {
            return false;
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
            const media = await this.media.getInfoFromVideoId(watchedItem.videoId, true);
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
     * @desc sets the seen status for a media as seen if not seen by a user
     * @param userId - the user identifier
     * @param mediaId - the media identifier
     */
    public async setSeen(userId: string, mediaId: number) {
        const seen = await this.checkIfSeen(userId, mediaId);
        const videos = await this.prisma.video.findMany({where: {mediaId}, include: {episode: true}});
        const userWatched = await this.prisma.watched.findMany({where: {userId, mediaId}});

        if (seen !== null && videos) {
            if (!seen) {
                await this.prisma.seenMedia.create({
                    data: {userId, mediaId, times: 1, updated: new Date()},
                });

                const intersect = this.intersect(videos, userWatched, 'id', 'videoId', 'times');
                const watched = videos.map(item => {
                    const video = intersect.find(item2 => item2.id === item.id);
                    return {
                        userId,
                        mediaId,
                        position: 1000,
                        videoId: item.id,
                        created: new Date(),
                        updated: new Date(),
                        episodeId: item.episode?.id,
                        times: video ? video.times : 1
                    }
                })

                await this.prisma.watched.deleteMany({where: {userId, mediaId}});
                await this.prisma.watched.createMany({data: watched});
            } else {
                await this.prisma.seenMedia.delete({
                    where: {seenByUser: {userId, mediaId}},
                });

                await this.prisma.watched.deleteMany({
                    where: {userId, mediaId},
                });
            }
            return !seen;
        }

        return null;
    }

    /**
     * @desc updates the seen status for a media on a user's profile
     * @param userId - the user identifier
     * @param mediaId - the media identifier
     */
    public async updateSeen(userId: string, mediaId: number) {
        const seen = await this.checkIfSeen(userId, mediaId);
        if (seen !== null) {
            if (seen) await this.prisma.seenMedia.update({
                where: {seenByUser: {userId, mediaId}}, data: {times: {increment: 1}},
            });

            else await this.prisma.seenMedia.create({
                data: {mediaId, userId, times: 1, updated: new Date()},
            });

            return true;
        }

        return null;
    }

    /**
     * @desc generate and save suggestions for the user based on the watched list, ratings and list of the user
     * @param userId - the user identifier
     */
    public async generateSuggestions(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: {userId}, include: {
                watched: {include: {media: true}},
                lists: {include: {media: true}},
                ratings: {include: {media: true}},
                suggestions: {include: {media: true}},
                seenMedia: {include: {media: true}},
            }
        });

        const appeared: Map<number, { times: number, tmdbId: number, type: MediaType }> = new Map();
        const suggestions: Map<number, { times: number, tmdbId: number, type: MediaType, id: number }> = new Map();

        if (user) {
            const watched = user.watched;
            const ratings = user.ratings;
            const lists = user.lists;
            const suggestion = user.suggestions;
            const seen = user.seenMedia;

            if (suggestion.length) {
                const suggestionItem = suggestion[0];
                if (suggestionItem) {
                    const check = new Date(new Date(suggestionItem.created).getTime() + (1000 * 60 * 60 * 24)) > new Date();
                    if (check) return;
                }
            }

            for (const watchedItem of watched) {
                const val = appeared.get(watchedItem.media.id);
                if (val) appeared.set(watchedItem.media.id, {
                    type: watchedItem.media.type, times: val.times + watchedItem.times, tmdbId: watchedItem.media.tmdbId
                }); else appeared.set(watchedItem.media.id, {
                    type: watchedItem.media.type, times: watchedItem.times, tmdbId: watchedItem.media.tmdbId
                });
            }

            for (const list of lists) {
                const val = appeared.get(list.media.id);
                if (val) appeared.set(list.media.id, {
                    type: list.media.type, times: val.times + 20, tmdbId: list.media.tmdbId
                }); else appeared.set(list.media.id, {type: list.media.type, times: 20, tmdbId: list.media.tmdbId});
            }

            for (const rating of ratings) {
                const val = appeared.get(rating.media.id);
                const rate = (rating.rate > 5 ? rating.rate : -rating.rate) * 2;
                if (val) appeared.set(rating.media.id, {
                    type: rating.media.type, times: val.times + rate, tmdbId: rating.media.tmdbId
                }); else appeared.set(rating.media.id, {
                    type: rating.media.type, times: rate, tmdbId: rating.media.tmdbId
                });
            }

            for (const seenItem of seen) {
                const val = appeared.get(seenItem.media.id);
                if (val) appeared.set(seenItem.media.id, {
                    type: seenItem.media.type, times: val.times + 1, tmdbId: seenItem.media.tmdbId
                }); else appeared.set(seenItem.media.id, {
                    type: seenItem.media.type, times: 1, tmdbId: seenItem.media.tmdbId
                });
            }

            const sortedDescMap = new Map([...appeared.entries()].sort((a, b) => b[1].times - a[1].times));

            for (const [id, media] of sortedDescMap) {
                const recommendations = await this.media.getSimilarMedia(id, 1);
                recommendations.forEach(e => {
                    const val = suggestions.get(e.id);
                    if (val) suggestions.set(e.id, {
                        id: e.id, type: e.type, times: val.times + media.times, tmdbId: e.tmdbId
                    }); else suggestions.set(e.id, {id: e.id, type: e.type, times: media.times, tmdbId: e.tmdbId});
                });
            }

            const suggestedToArray = this.sortArray(Array.from(suggestions.values()), 'times', 'desc');

            const suggestedMediaId = suggestedToArray.map(item => item.id);

            const seenFinished = await this.prisma.seenMedia.findMany({
                where: {AND: [{userId: userId}, {mediaId: {in: suggestedMediaId}}]}, select: {mediaId: true}
            });

            const suggestedSeen = suggestedToArray.filter(item => seenFinished.some(e => e.mediaId === item.id)).map(x => {
                return {times: x.times, userId, mediaId: x.id, seen: true}
            });

            const notSeen = suggestedToArray.filter(item => !seenFinished.some(e => e.mediaId === item.id)).map(x => {
                return {times: x.times, userId, mediaId: x.id, seen: false}
            });

            const all = this.sortArray(this.uniqueId(suggestedSeen.concat(notSeen), 'mediaId'), 'times', 'desc');

            await this.prisma.suggestion.deleteMany({where: {userId}});

            await this.prisma.suggestion.createMany({data: all});
        }
    }

    /**
     * @dsec gets the similarity index between two users by comparing their activities
     * @param firstUserId - The first user to compare
     * @param secondUserId - The second user to compare
     */
    public async getSimilarityIndex(firstUserId: string, secondUserId: string): Promise<number> {
        const firstUser = await this.prisma.user.findUnique({
            where: {userId: firstUserId}, include: {
                ratings: true,
                seenMedia: true,
                lists: true,
                watched: {where: {times: {gt: 0}}}
            }
        });

        const secondUser = await this.prisma.user.findUnique({
            where: {userId: secondUserId}, include: {
                ratings: true,
                seenMedia: true,
                lists: true,
                watched: {where: {times: {gt: 0}}}
            }
        });

        if (!firstUser || !secondUser)
            return 0;

        const ratings = this.intersect(firstUser.ratings, secondUser.ratings, 'mediaId', 'mediaId', 'rate');
        const seen = this.intersect(firstUser.seenMedia, secondUser.seenMedia, 'mediaId', 'mediaId', 'times');
        const lists = this.intersect(firstUser.lists, secondUser.lists, 'mediaId', 'mediaId');
        const watched = this.intersect(firstUser.watched, secondUser.watched, 'videoId', 'videoId', 'times');

        const seenValue = seen.reduce((acc, curr) => acc + curr.times, 0);
        const watchedValue = watched.reduce((acc, curr) => acc + curr.times, 0);
        const listsValue = lists.length;
        const ratingsValue = ratings.reduce((acc, curr) => acc + (curr.rate > 5 ? curr.rate : -curr.rate), 0);

        return (seenValue + listsValue + ratingsValue + watchedValue) / 4;
    }

    /**
     * @desc Get all the suggestions for a user
     * @param userId - The user id
     * @param seen - Whether the user has seen the media or not
     * @param type - The type of media to get suggestions for (optional)
     * @param page - The page number (optional)
     * @param limit - The number of items per page (optional)
     */
    public async getSuggestions(userId: string, seen: boolean, type?: MediaType, page?: number, limit?: number) {
        if (type && page && limit) {
            const suggestions = await this.prisma.suggestion.findMany({
                where: {userId, media: {type}, seen},
                include: {media: true},
                orderBy: {times: 'desc'},
                skip: (page - 1) * 100,
                take: limit
            });

            return suggestions.map(e => e.media);

        } else {
            const suggestions = await this.prisma.suggestion.findMany({
                where: {userId, seen}, include: {media: true}, orderBy: {times: 'desc'}
            });

            return suggestions.map(e => e.media);
        }
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
                            AND: [{
                                collection: {
                                    path: ['id'], equals: col.id
                                }
                            },]
                        }, orderBy: {release: 'asc'}, include: {videos: true}
                    });

                    const medIndex = collections.findIndex(m => m.id === media.id);
                    const next = medIndex !== -1 && medIndex + 1 < collections.length ? collections[medIndex + 1] : null;
                    if (next) return next.videos[0].id;
                }
            } else if (video.episode) {
                const nextEpisode = await this.media.getNextEpisode(video.media.id, video.episode.id, 'next');
                if (nextEpisode) return nextEpisode.videoId;
            }

            const recommended = await this.tmdb?.getRecommendations(media.tmdbId, media.type);
            if (recommended?.length) {
                const tmdbIds = recommended.map(item => item.id).filter(id => id !== video.media.tmdbId);
                const med = await this.prisma.media.findMany({
                    where: {AND: [{tmdbId: {in: tmdbIds}}, {type: media.type}]}, include: {videos: true}
                });
                if (med.length) {
                    const next = med[Math.floor(Math.random() * med.length)];
                    if (next.type === MediaType.MOVIE) return next.videos[0].id;

                    const nextEpisode = await this.getNextEpisode(next.id, userId);
                    if (nextEpisode) return nextEpisode.episode.videoId;
                }
            }

            const randoms = await this.prisma.media.findMany({
                where: {AND: [{type: media.type}, {NOT: {id: media.id}}]},
                orderBy: {release: 'asc'},
                include: {videos: true}
            });

            const random = randoms[Math.floor(Math.random() * randoms.length)];
            if (random && random.type === MediaType.MOVIE) return random.videos[0].id;

            const nextEpisode = await this.getNextEpisode(random.id, userId);
            if (nextEpisode) return nextEpisode.episode.videoId;
        }

        return null;
    }

    /**
     * @desc Gets all notifications for a user
     * @param userId - The user identifier
     */
    public async getNotifications(userId: string): Promise<Omit<NotificationInterface, 'message' | 'data' | 'type'>[]> {
        const user = await this.prisma.user.findUnique({where: {userId}, include: {notifications: true}});
        if (user) {
            const users = await this.prisma.user.findMany();
            const notifications = user.notifications;
            const now = new Date();

            return notifications.map(notification => {
                const sender = users.find(user => user.userId === notification.senderId);
                const received = this.compareDates(notification.created, now);

                return {
                    title: notification.title,
                    opened: notification.opened,
                    received,
                    sender: sender?.email.split('@')[0] || 'frames AI',
                }
            });
        }

        return [];
    }

    /**
     * @desc Gets a notification by id
     * @param userId - The user identifier
     * @param notificationId - The notification identifier
     */
    public async getNotification(userId: string, notificationId: number): Promise<any> {
        const now = new Date();
        const user = await this.prisma.user.findUnique({where: {userId}});
        const notification = await this.prisma.notification.findUnique({where: {id: notificationId}});

        if (user && notification && notification.receiverId === user.userId) {
            const sender = await this.prisma.user.findUnique({where: {userId: notification.senderId}});
            const created = this.compareDates(notification.created, now);
            if (sender) {
                return {
                    title: notification.title,
                    message: notification.message,
                    opened: notification.opened,
                    created,
                    sender: sender?.email.split('@')[0] || 'frames AI',
                }
            }
        }

        return null;
    }

    /**
     * @desc Sends a notification to a user from frames AI or another user
     * @param userId - The user identifier
     * @param message - The message to send
     * @param title - The title of the message
     * @param image - The image for the message
     * @param url - The url for the message
     * @param type - The type of the message
     * @param senderEmail - The email of the sender (optional)
     */
    public async sendMessage(userId: string, message: string, title: string, image: string, url: string, type: string, senderEmail?: string) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const senderUser = await this.prisma.user.findUnique({where: {email: senderEmail || 'frames AI'}});
        if (user && senderUser) {
            await this.prisma.notification.create({
                data: {
                    message, opened: false, image, url, senderId: senderUser.userId, title, receiverId: user.userId,
                },
            });
            const payload: NotificationInterface = {
                type, sender: senderUser.email.split('@')[0], message, opened: false, title, data: url,
            }

            await this.broadCastToUser(user.userId, payload);
        }
    }

    /**
     * @desc broadcasts a message to a user
     * @param userId - The user identifier
     * @param message - The message to broadcast
     */
    public async broadCastToUser(userId: string, message: NotificationInterface) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            const payload = {...message, from: 'homeBase'};
            return await this.push(payload, `notification:${user.notificationChannel}`);
        }
    }

    /**
     * @desc Marks a notification as opened
     * @param userId - The user identifier
     * @param notificationId - The notification identifier
     */
    public async openNotification(userId: string, notificationId: number): Promise<any> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const notification = await this.prisma.notification.findUnique({where: {id: notificationId}});
        if (user && notification && user.userId === notification.receiverId) {
            return await this.prisma.notification.update({
                where: {id: notificationId}, data: {opened: true},
            });
        }

        return null;
    }

    /**
     * @desc Gets all messages a user has sent
     * @param userId - The user identifier
     */
    public async getMessages(userId: string): Promise<Omit<MessageInterface, 'message'>[]> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            const messages = await this.prisma.notification.findMany({where: {senderId: user.userId}});
            const users = await this.prisma.user.findMany();

            return messages.map(message => {
                const sender = users.find(user => user.userId === message.senderId);
                const receiver = users.find(user => user.userId === message.receiverId);
                const sent = this.compareDates(message.created);

                return {
                    title: message.title,
                    sender: sender?.email.split('@')[0] || 'frames AI',
                    receiver: receiver?.email.split('@')[0] || 'frames AI',
                    seen: message.opened,
                    sent
                };
            });
        }

        return [];
    }

    /**
     * @desc Gets a message from a user
     * @param userId - The user identifier
     * @param messageId - The message identifier
     */
    public async getMessage(userId: string, messageId: number): Promise<MessageInterface | null> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const message = await this.prisma.notification.findUnique({
            where: {id: messageId}, include: {sender: true, receiver: true}
        });
        if (user && message) {
            const sent = this.compareDates(message.created);

            return {
                title: message.title,
                message: message.message,
                seen: message.opened,
                sent,
                sender: message.sender.email.split('@')[0] || 'frames AI',
                receiver: message.receiver.email.split('@')[0] || 'frames AI',
            }
        }

        return null;
    }

    /**
     * @desc gets the browse page grid layout
     * @param data - The data to use
     * @param page - The page to use
     * @param userId - The user identifier
     */
    public async getBrowse(data: { genres: string[], decade: string, mediaType: MediaType }, page: number, userId: string) {
        const {genres, decade, mediaType} = data;
        let media: Media[];

        if (genres.length === 0 && decade === '') media = await this.getSuggestions(userId, false, mediaType, page, 100);

        else if (genres.length > 0 && decade !== '') {
            const newDecade = +decade.replace('s', '');
            const decadeStart = new Date(newDecade, 0, 1);
            const decadeEnd = new Date(newDecade + 10, 0, 1);
            const data = genres.reduce((acc, genre) => genre + ' & ' + acc, '').replace(/\s&\s$/, '');

            media = await this.prisma.media.findMany({
                where: {
                    AND: [{type: mediaType}, {release: {gt: decadeStart}}, {release: {lte: decadeEnd}}, // @ts-ignore
                        {genre: {search: data}}]
                }, skip: (page - 1) * 100, take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });
        } else if (genres.length > 0 && decade === '') {
            const data = genres.reduce((acc, genre) => genre + ' & ' + acc, '').replace(/\s&\s$/, '');
            media = await this.prisma.media.findMany({
                where: {
                    AND: [{type: mediaType}, // @ts-ignore
                        {genre: {search: data}}]
                }, skip: (page - 1) * 100, take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });

        } else {
            const newDecade = +decade.replace('s', '');
            const decadeStart = new Date(newDecade, 0, 1);
            const decadeEnd = new Date(newDecade + 10, 0, 1);
            media = await this.prisma.media.findMany({
                where: {
                    AND: [{type: mediaType}, {release: {gt: decadeStart}}, {release: {lte: decadeEnd}}]
                }, skip: (page - 1) * 100, take: 100, orderBy: [{release: 'desc'}, {vote_average: 'desc'}]
            });
        }

        const newData: Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[] = media.map(item => {
            let {id, type, backdrop, logo, name, genre, release} = item;
            release = release || new Date();
            return {id, type, backdrop, logo, name, genre, release};
        });

        return newData;
    }

    /**
     * @desc gets the user's suggestions for the homepage
     * @param userId - The user identifier
     * @param seen - Whether the user has seen the suggestion
     */
    public async getSuggestionForHome(userId: string, seen: boolean) {
        const suggestions = await this.prisma.suggestion.findMany({
            where: {userId, seen}, include: {media: true}, orderBy: {times: 'desc'},
        });
        const shuffled = this.shuffle(suggestions, 12, 0);

        const data = this.sortArray(shuffled, ['times'], ['desc']);
        return {
            display: seen ? 'a second go round?' : 'just for you',
            type: 'BASIC', data: data.map(e => {
                const {background, id, type, name, poster} = e.media;
                return {background, id, type, name, poster}
            }) as any
        }
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
            const times = seen ? (watched?.times || 0) + 1 : (watched?.times || 0);
            await this.prisma.watched.upsert({
                where: {seenByUser: {userId, videoId: video.id}},
                update: {position, updated: new Date()},
                create: {
                    mediaId: media.id,
                    userId, videoId: video.id,
                    times, position, episodeId: episode?.id,
                    created: new Date(), updated: new Date()
                }
            })

            if (seen && episode) {
                const newEpisode = await this.media.getNextEpisode(media.id, episode.id, "next");
                if (newEpisode)
                    await this.prisma.watched.upsert({
                        create: {
                            mediaId: media.id,
                            userId, videoId: newEpisode.videoId,
                            times: 0, position: 0, episodeId: newEpisode.id,
                            created: new Date(), updated: new Date()
                        },
                        update: {updated: new Date()},
                        where: {seenByUser: {userId, videoId: newEpisode.videoId}}
                    });

                else
                    await this.updateSeen(userId, media.id);
            }
        }
    }

    /**
     * @desc gets the next episode for playback based on user's activity
     * @param mediaId - the media id
     * @param userId - the user id
     * @protected
     */
    public async getNextEpisode(mediaId: number, userId: string): Promise<{ episode: Episode, position: number } | null> {
        const watched = await this.prisma.watched.findMany({where: {userId, mediaId}, orderBy: {updated: 'desc'}});
        if (watched.length > 0) {
            if (watched[0].episodeId) {
                if (watched[0].position > 939) {
                    const firstEpisode = await this.media.getNextEpisode(mediaId, watched[0].episodeId, 'first');
                    const nextEpisode = await this.media.getNextEpisode(mediaId, watched[0].episodeId, 'next');
                    if (nextEpisode) return {episode: nextEpisode, position: 0};

                    else if (firstEpisode) {
                        const episode = await this.prisma.episode.findMany({where: {showId: mediaId}});
                        const notWatched = episode.filter(e => watched.every(w => w.episodeId !== e.id));
                        const data = notWatched.map(e => {
                            return {
                                userId,
                                mediaId,
                                videoId: e.videoId,
                                position: 1000,
                                episodeId: e.id,
                                finished: 2,
                                times: 1,
                                updated: new Date()
                            }
                        })

                        await this.prisma.watched.createMany({data});
                        await this.updateSeen(userId, mediaId);

                        return {episode: firstEpisode, position: 0};
                    }

                } else {
                    const episode = await this.prisma.episode.findUnique({where: {id: watched[0].episodeId}});
                    if (episode) return {episode, position: watched[0].position};
                }
            }

        } else {
            const episode = await this.media.getNextEpisode(mediaId, 0, 'first');
            if (episode) return {episode, position: 0};
        }

        return null;
    }

    /**
     * @desc checks if the user has a watched specific media
     * @param userId - the user identifier
     * @param mediaId - the media identifier
     * @private
     */
    private async checkIfSeen(userId: string, mediaId: number): Promise<boolean | null> {
        const media = await this.prisma.media.findUnique({
            where: {id: mediaId},
        });
        const user = await this.prisma.user.findUnique({
            where: {userId},
        });

        if (user && media) {
            const seen = await this.prisma.seenMedia.findUnique({
                where: {seenByUser: {userId, mediaId}}
            });
            if (media.type === MediaType.SHOW && seen) {
                const lastEpisode = await this.media.getNextEpisode(mediaId, 0, 'last');
                if (lastEpisode) {
                    const watchedVideos = await this.prisma.watched.findMany({
                        where: {userId, mediaId},
                        orderBy: {updated: 'desc'},
                        include: {episode: true}
                    });

                    const watchedEpisodes = this.sortArray(watchedVideos.map(w => w.episode as Episode), ['seasonId', 'episode'], ['desc', 'desc']);

                    const lastSeen = watchedEpisodes.length ? watchedEpisodes[0] : null;

                    if (seen && lastSeen && lastSeen.id !== lastEpisode.id) {
                        const nextEpisode = await this.media.getNextEpisode(mediaId, lastSeen.id, 'next');
                        await this.prisma.seenMedia.delete({
                            where: {seenByUser: {userId, mediaId}}
                        });

                        if (nextEpisode) {
                            await this.prisma.watched.upsert({
                                where: {seenByUser: {userId, videoId: nextEpisode.videoId}},
                                create: {
                                    userId,
                                    mediaId,
                                    videoId: nextEpisode.videoId,
                                    position: 0,
                                    episodeId: nextEpisode.id,
                                    updated: lastSeen.updated,
                                    created: lastSeen.updated,
                                },
                                update: {
                                    position: 0,
                                    updated: lastSeen.updated,
                                }
                            });

                            return false;
                        }
                    }

                    return true;
                }
            }

            return !!seen;
        }

        return null;
    }
}