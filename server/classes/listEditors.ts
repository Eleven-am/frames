import {Generator, MediaType, PickType, Role} from '@prisma/client';
import {SpringMedia, SpringMedUserSpecifics, UpNext, WithRequired} from "./media";
import PlayBack, {SpringLoad} from "./playBack";
import {Base} from "./auth";
import {UpdateSearch} from "./modify";

export interface PlayListResponse {
    /**
     * the id of the video entry on the playlist table
     */
    id: number;
    videoId: number;
    /**
     * the identifier value of the playlist
     */
    identifier: string;
    /**
     * the human name of the playlist
     */
    playList: string;
}

export interface PickSummary {
    category: string;
    display: string;
    poster: string;
    overview: string;
    active: boolean;
    type: PickType;
    picks: UpdateSearch[];
}

export interface EditPickInterface {
    type: PickType;
    active: boolean;
    display: string;
    category: string;
    media: Pick<SpringMedia, 'id' | 'type' | 'name' | 'poster' | 'backdrop' | 'logo'>[]
}

export interface FramePlaylistVideo {
    id: number;
    name: string;
    overview: string;
    backdrop: string;
    logo: string | null;
    type: MediaType;
}

export interface FramesPlaylist {
    name: string;
    identifier: string;
    isPublic: boolean;
    generator: Generator;
    overview: string | null;
    backdrop: string;
    logo: string | null;
    videos: FramePlaylistVideo[];
    timestamp: string;
    location: string;
}

export type SectionType = "EDITOR" | 'BASIC' | 'SECTION'

export type SectionPick<T> = T extends 'BASIC' ? { data: Pick<SpringMedia, 'id' | 'type' | 'name' | 'poster'>[], type: PickType, display: string } : T extends 'EDITOR' ? { data: Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'>[], type: PickType, display: string } : never;

export interface SpringPlay extends SpringLoad {
    position: number;
}

export class ListEditors extends Base {

    /**
     * @desc get the list of all media in user's list
     * @param userId - user identifier
     */
    public async getMyList(userId: string): Promise<SectionPick<'BASIC'>> {
        let myList = await this.prisma.listItem.findMany({where: {userId}, include: {media: true}});

        return {
            type: PickType.BASIC, data: this.sortArray(myList.map(item => {
                let list = item.media;
                return {
                    updated: item.updated,
                    background: list.background,
                    id: list.id,
                    poster: list.poster,
                    type: list.type,
                    name: list.name
                }
            }), 'updated', 'desc') as any, display: 'my list'
        };
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
     * @desc Array of media element in a category
     * @param category - category identifier
     */
    async getCategory<T extends PickType>(category: string): Promise<SectionPick<T>> {
        let pick = await this.prisma.pick.findMany({where: {category}, include: {media: true}});
        if (pick[0]?.type === PickType.BASIC) {
            let data = pick.map(item => {
                return {
                    background: item.media.background,
                    id: item.media.id,
                    name: item.media.name,
                    poster: item.media.poster,
                    type: item.media.type
                }
            })

            let display = pick.length ? pick[0].display : category;
            return {display, data, type: PickType.BASIC} as unknown as SectionPick<T>;
        } else {
            let data = pick.map(item => {
                return {
                    id: item.media.id,
                    name: item.media.name,
                    logo: item.media.logo,
                    backdrop: item.media.backdrop,
                    type: item.media.type
                }
            })

            let display = pick.length ? pick[0].display : category;
            return {display, data, type: PickType.EDITOR} as unknown as SectionPick<T>;
        }
    }

    /**
     * @desc adds a list of media to the database
     * @param data - a number array containing the mediaId of the media to be added
     * @param category - the cypher string to request the pick on load
     * @param display - the information displayed for the pick
     * @param type - type of pick
     * @param active - set to true if the pick is active
     */
    async addPick(data: number[], category: string, display: string, type: PickType, active: boolean) {
        display = display.toLowerCase();
        category = category.toLowerCase();
        await this.prisma.pick.deleteMany({where: {category}});
        if (type === PickType.BASIC) await this.prisma.pick.updateMany({
            where: {type: PickType.BASIC}, data: {active: false, type: PickType.EDITOR}
        });

        let res = data.map(e => {
            return {
                mediaId: e, display, category, active, type,
            }
        })

        await this.prisma.pick.createMany({data: res});
        let picks = await this.prisma.pick.findMany({
            distinct: ['category'], orderBy: {id: 'asc'}, where: {AND: [{active: true}, {NOT: {category}}]}
        });

        if (picks.length > 1 && active) await this.prisma.pick.updateMany({
            where: {category: picks[0].category},
            data: {active: false}
        });
    }

    /**
     * @desc sets rate value on a media for a user
     * @param mediaId - media identifier to be rated
     * @param userId - user identifier
     * @param rate - rate value
     */
    async rateThis(mediaId: number, userId: string, rate: number): Promise<boolean> {
        let list = await this.prisma.rating.findFirst({where: {userId, mediaId}});
        if (list) await this.prisma.rating.update({where: {id: list.id,}, data: {rate}})

        else await this.prisma.rating.create({data: {mediaId, userId, rate}})

        return true;
    }

    /**
     * @desc gets a summary of all the picks available
     */
    async getPicks(): Promise<PickSummary[]> {
        const categories = await this.prisma.pick.findMany({
            select: {category: true}, distinct: ['category'], orderBy: {category: 'asc'}
        });
        const picks = await this.prisma.pick.findMany({
            include: {
                media: {
                    select: {
                        poster: true,
                        name: true,
                        background: true,
                        type: true,
                        id: true,
                        logo: true,
                        backdrop: true,
                        overview: true,
                        tmdbId: true
                    }
                }
            }, orderBy: {id: 'asc'}
        });

        const data: PickSummary[] = [];
        for (let item of categories) {
            const mediaPick = picks.filter(e => e.category === item.category);
            let temps = picks.filter(e => e.category === item.category);
            const last = temps.pop();
            let overview = temps.map(e => e.media.name).join(', ') + (last ? ' and ' + last.media.name : '');
            overview = temps[0].display + ' includes ' + overview;
            const poster = temps[0].media.poster;
            const media = mediaPick.map(e => {
                return {
                    type: e.media.type,
                    id: e.media.id,
                    name: e.media.name,
                    tmdbId: e.media.tmdbId,
                    overview: e.media.overview,
                    poster: e.media.poster,
                    backdrop: e.media.backdrop,
                    logo: e.media.logo,
                    background: e.media.background
                }
            });
            data.push({
                ...item,
                poster,
                overview,
                display: temps[0].display,
                picks: media,
                type: temps[0].type,
                active: temps[0].active
            });
        }

        return data;
    }

    /**
     * @desc gets a specific editor pick useful for editing
     * @param category - category
     */
    async getSpecificPick(category: string): Promise<EditPickInterface> {
        let pick = await this.prisma.pick.findMany({where: {category}, include: {media: true}});
        const type = pick[0]?.type;
        const active = pick.length ? pick[0].active : false;
        const media: {
            id: number; type: MediaType; backdrop: string; poster: string; logo: string | null; name: string;
        }[] = pick.map(item => {
            return {
                background: item.media.background,
                id: item.media.id,
                name: item.media.name,
                poster: item.media.poster,
                type: item.media.type,
                logo: item.media.logo,
                backdrop: item.media.backdrop
            }
        })
        const display = pick[0]?.display;
        return {type, media, display, category, active}
    }

    /**
     * @desc gets a pick based on the query provided
     * @param query - query to be used
     */
    public async getPick(query: string) {
        const type = /^editor/i.test(query) ? PickType.EDITOR : PickType.BASIC;
        const match = query.match(/(editor|basic)(?<number>\d+)$/);
        const number = parseInt(match?.groups?.number ?? '1');

        let picks = await this.prisma.pick.findMany({
            distinct: ['category'], where: {type},
        });

        if (number <= picks.length) return await this.getCategory(picks[number - 1].category);

        else return {data: [], type: PickType.BASIC, display: ''};
    }

}

export class Playlist extends PlayBack {

    /**
     * @desc saves a new playlist to the database
     * @param userId - user identifier
     * @param videos - videos to be saved
     * @param name - name of the playlist
     * @param overview - description of the playlist
     * @param isPublic - is the playlist public
     * @param identifier - identifier of the playlist
     */
    public async createPlaylist(userId: string, videos: number[], name: string, overview: string, isPublic: boolean, identifier: string) {
        const generator = Generator.USER;
        const playlist = await this.prisma.playlist.upsert({
            where: {identifier},
            create: {
                identifier,
                name,
                overview,
                isPublic,
                generator,
                created: new Date(),
                userId,
            },
            update: {
                isPublic, overview, name,
                created: new Date(),
            },
        });

        if (playlist) {
            await this.prisma.playlistVideo.deleteMany({where: {playlistId: playlist.identifier}});
            await this.prisma.playlistVideo.createMany({
                data: videos.map(video => ({
                    playlistId: playlist.identifier,
                    videoId: video,
                })),
            });

            return true;
        }

        return false;
    }

    /**
     * @desc creates a playlist in the order the videos where provided
     * @param videos - a number[] of the videoIds to be added to the playlist
     * @param name - user generic name provided for the playlist
     * @param userId - user identifier
     * @param overview - user provided overview for the playlist
     * @param generator - generated automatically by frames or by the user
     * @param isPublic - if the playlist is public or not
     */
    public async createPlaylists(videos: number[], name: string, userId: string, overview: string, generator: Generator, isPublic = false): Promise<string> {
        const identifier = this.generateKey(7, 5);
        if (generator === Generator.FRAMES) await this.prisma.playlist.deleteMany({where: {name, userId}});

        await this.prisma.playlist.create({
            data: {
                userId, name, identifier, generator, isPublic, overview,
                created: new Date(),
            }
        });

        const data = videos.map(e => {
            return {videoId: e, playlistId: identifier}
        })

        await this.prisma.playlistVideo.createMany({data});
        return identifier;
    }

    /**
     * @desc gets the next video in the playlist cue based on the identifier of the currently playing video
     * @param id - the playlist identifier of the currently playing video
     */
    public async retrieveNextVideo(id: number): Promise<PlayListResponse | null> {
        const video = await this.prisma.playlistVideo.findUnique({where: {id}});
        if (video) {
            const {playlistId} = video;
            const nextVideo = await this.prisma.playlistVideo.findFirst({
                where: {AND: [{playlistId}, {id: {gt: id}}]}, include: {playlist: true}
            });
            if (nextVideo) {
                return {
                    id: nextVideo.id,
                    videoId: nextVideo.videoId,
                    identifier: playlistId,
                    playList: nextVideo.playlist.name
                }
            }
        }

        return null;
    }

    /**
     * @dwsc deletes a playlist
     * @param userId - the user identifier
     * @param identifier - the identifier of the playlist to be deleted
     */
    public async deletePlaylist(userId: string, identifier: string): Promise<boolean> {
        const playlist = await this.prisma.playlist.findUnique({where: {identifier}});
        if (playlist && playlist.userId === userId) {
            await this.prisma.playlistVideo.deleteMany({where: {playlistId: identifier}});
            await this.prisma.playlist.delete({where: {identifier}});
            return true;
        }

        return false;
    }

    /**
     * @desc generates a shuffled playlist of all the episode in a tv show media
     * @param mediaId - media identifier for which episodes would be shuffled
     * @param userId - user identifier
     */
    public async shuffleMedia(mediaId: number, userId: string): Promise<PlayListResponse | null> {
        const media = await this.prisma.media.findFirst({where: {id: mediaId}, include: {videos: true}});
        if (media && media.type === 'SHOW') {
            const videos = this.randomise(media.videos, media.videos.length, 0);
            const shuffle = videos.map(e => e.id);
            const overview = `Frames generated a shuffled playlist for ${media.name}: ${media.overview}`;
            const identifier = await this.createPlaylists(shuffle, 'shuffle', userId, overview, Generator.FRAMES);
            return await this.findFirstVideo(identifier, userId);
        }

        return null;
    }

    /**
     * @desc adds new videos to an existing playlist
     * @param identifier - the playlist identifier
     * @param videos - a number[] of the videoIds to be added to the playlist
     * @param userId - user identifier
     */
    public async addToPlayList(userId: string, identifier: string, videos: number | number[]) {
        const playlist = await this.prisma.playlist.findFirst({where: {identifier}});
        if (playlist?.userId === userId) {
            const toAdd = Array.isArray(videos) ? videos : [videos];
            const data = toAdd.map(e => {
                return {videoId: e, playlistId: identifier}
            })

            await this.prisma.playlistVideo.createMany({data});
            await this.prisma.playlist.update({
                where: {identifier},
                data: {
                    created: new Date()
                }
            });
            return true;
        }

        return false;
    }

    /**
     * @desc gets the first video in the playlist
     * @param identifier - the playlist identifier
     * @param userId - user identifier
     */
    public async findFirstVideo(identifier: string, userId: string): Promise<PlayListResponse | null> {
        const playlist = await this.prisma.playlist.findUnique({where: {identifier}});
        const next = await this.prisma.playlistVideo.findFirst({where: {playlistId: identifier}});
        if (next && playlist && (playlist.userId === userId || playlist.isPublic)) return {
            id: next.id, videoId: next.videoId, playList: playlist.name, identifier,
        }

        return null;
    }

    /**
     * @desc gets the integral playlist information
     * @param identifier - the playlist identifier
     * @param userId - user identifier
     */
    public async getPlaylist(identifier: string, userId: string): Promise<FramesPlaylist> {
        const playlist = await this.prisma.playlist.findUnique({
            where: {identifier},
            include: {playlistVideos: {orderBy: {id: 'asc'} ,include: {video: {include: {media: true, episode: true}}}}}
        });

        if (playlist && (playlist.userId === userId || playlist.isPublic)) {
            const name = playlist.name;
            const playlistVideos = playlist.playlistVideos;

            const videos: FramePlaylistVideo[] = playlistVideos.map(v => {
                const {media, episode} = v.video;
                return {
                    id: v.id,
                    overview: episode?.overview || media.overview,
                    name: episode ? `${media.name}, S${episode.seasonId}: E${episode.episode}` : media.name,
                    backdrop: media.backdrop, logo: media.logo, type: media.type,
                }
            })

           return {
                name, identifier, videos,
                isPublic: playlist.isPublic,
                generator: playlist.generator,
                overview: playlist.overview,
                backdrop: videos[0]?.backdrop,
                logo: videos[0]?.logo,
                timestamp: this.compareDates(playlist.created),
                location: `/watch?playlistId=${playlistVideos[0].id}`,
            }
        }

        return {
            name: '', identifier: identifier, videos: [],
            isPublic: true,
            generator: Generator.USER,
            overview: '',
            backdrop: '',
            logo: '',
            timestamp: '',
            location: '',
        }
    }

    /**
     * @desc gets all the videos in the FramePlaylistVideo format from a specific media
     * @param mediaId - the media identifier
     */
    public async getVideosForMedia(mediaId: number): Promise<{data: FramePlaylistVideo[], name: string}> {
        const videos = await this.prisma.video.findMany({where: {mediaId}, include: {media: true, episode: true}});

        const data = videos.map(v => {
            const {media, episode} = v;
            return {
                id: v.id,
                overview: episode?.overview || media.overview,
                name: episode ? `${media.name}, S${episode.seasonId}: E${episode.episode}` : media.name,
                backdrop: media.backdrop, logo: media.logo, type: media.type,
            }
        })

        const name = videos[0]?.media.name || '';
        return {data, name};
    }

    /**
     * @desc gets the information in the FramePlaylistVideo format of a specific video
     * @param videoId - the video identifier
     */
    public async getVideoForPlaylist(videoId: number): Promise<{data: FramePlaylistVideo, name: string} | null> {
        const video = await this.prisma.video.findUnique({where: {id: videoId}, include: {media: true, episode: true}});

        if (video) {
            const {media, episode} = video;
            const data: FramePlaylistVideo = {
                id: video.id,
                overview: episode?.overview || media.overview,
                name: episode ? `${media.name}, S${episode.seasonId}: E${episode.episode}` : media.name,
                backdrop: media.backdrop, logo: media.logo, type: media.type,
            }

            const name = media.name;
            return {data, name};
        }

        return null;
    }

    /**
     * @desc Generates the playlist for a given item for a user
     * @param type - the type of playlist to generate
     * @param itemId - the item identifier
     * @param userId - the user identifier
     */
    public async generatePlaylist(type: 'PERSON' | 'COLLECTION' | 'COMPANY', itemId: number | string, userId: string) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        let videoId: PlayListResponse | null = null;
        if (user) {
            switch (type) {
                case "COLLECTION":
                    const collection = await this.prisma.media.findMany({
                        where: {
                            collection: {
                                path: ['id'], equals: itemId
                            }
                        }, orderBy: {release: 'asc'}, include: {videos: true}
                    });
                    const videosIds = collection.map(e => e.videos.map(e => e.id)).flat();
                    if (videosIds.length) {
                        const collection1 = collection[0].collection as { name: string };
                        const overview = `Frames created a playlist for the ${collection1.name} Collection: with ${videosIds.length} items`;
                        const playlistId = await this.createPlaylists(videosIds, collection1.name, user.userId, overview, Generator.FRAMES, false);
                        videoId = await this.findFirstVideo(playlistId, user.userId);
                    }

                    break;

                case "PERSON":
                    const personMedia = await this.prisma.media.findMany({
                        where: {
                            castCrews: {
                                some: {tmdbId: itemId as number}
                            }
                        }, include: {videos: true, castCrews: true}, orderBy: {release: 'asc'}
                    });
                    const videosIdsPerson = personMedia.map(e => e.videos.map(e => e.id)).flat();
                    if (videosIdsPerson.length) {
                        const person = personMedia[0].castCrews.find(e => e.tmdbId === itemId);
                        const overview = `Frames created a playlist for ${person!.name} with ${videosIdsPerson.length} items`;
                        const playlistId = await this.createPlaylists(videosIdsPerson, person!.name, user.userId, overview, Generator.FRAMES, false);
                        videoId = await this.findFirstVideo(playlistId, user.userId);
                    }
                    break;

                case "COMPANY":
                    const media = await this.prisma.media.findMany({include: {videos: true}}) as any[];
                    const productionCompanies = media.filter(e => e.production.some((e: any) => e.id === itemId));
                    const videosIdsCompany = productionCompanies.map(e => e.videos.map((e: any) => e.id)).flat();
                    if (videosIdsCompany.length) {
                        const company = productionCompanies[0].production.find((e: any) => e.id === itemId);
                        const overview = `Frames created a playlist for ${company!.name} with ${videosIdsCompany.length} items`;
                        const playlistId = await this.createPlaylists(videosIdsCompany, company!.name, user.userId, overview, Generator.FRAMES, false);
                        videoId = await this.findFirstVideo(playlistId, user.userId);
                    }
                    break;
            }
        }

        return videoId;
    }

    /**
     * @desc generates a SpringPlay for playback of a video in a playlist
     * @param playlistId identifier of present video on playlist queue
     * @param userId user identifier
     */
    public async generatePlayback(playlistId: number, userId: string): Promise<WithRequired<SpringPlay, 'playlistId'> | null> {
        const playVideo = await this.prisma.playlistVideo.findUnique({
            where: {id: playlistId}, include: {video: {include: {episode: true}}, playlist: true}
        });

        if (playVideo) {
            const inform = playVideo.playlist.name !== 'shuffle';
            const data = await this.setPlayBack(playVideo.video.id, userId, inform, playlistId);
            if (data) return {...data, playlistId, position: 0};
        }

        return null;
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
            const video = await this.retrieveNextVideo(view.playlistId);
            videoId = video?.videoId || null;
            playlistId = video?.id || null;

        } else if (view) videoId = view.videoId;

        if (videoId) {
            const upNextVideoId = playlistId ? videoId : await this.getNextVideoId(videoId, userId);
            if (upNextVideoId) {
                const data = await this.mediaClass?.getInfoFromVideoId(upNextVideoId, true);
                if (data) {
                    if (playlistId) return {
                        ...data,
                        type: 'PLAYLIST',
                        playlistId,
                        location: 'watch?playlistId=' + playlistId
                    }

                    else return {...data, location: data.location + '&resetPosition=true'};
                }
            }
        }

        return null;
    }

    /**
     * @desc gets the SpringPlay object for playback of a media item
     * @param mediaId - the media identifier
     * @param userId - the user identifier
     * @param inform - weather to inform the database about the playback
     * @param type -
     */
    public async startPlayback(mediaId: any, userId: string, inform: boolean, type: 'PLAYLIST' | 'EPISODE' | 'MEDIA' | 'IDENTIFIER'): Promise<SpringPlay | null> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        console.log(user, {mediaId, userId, inform, type});
        if (type === 'PLAYLIST') return this.generatePlayback(mediaId, userId);

        else if (type === 'IDENTIFIER') {
            const video = await this.findFirstVideo(mediaId, userId);
            if (video) return this.generatePlayback(video.id, userId);

        } else if (type === 'MEDIA' && user) {
            const media = await this.prisma.media.findUnique({where: {id: mediaId}, include: {videos: true}});
            console.log(media);
            if (media) {
                if (media.type === MediaType.MOVIE)
                    return await this.setPlayBack(media.videos[0].id, userId, inform, null);

                else {
                    const episode = await this.getNextEpisodeForUser(media.id, userId);
                    console.log(episode);
                    if (episode) {
                        const data = await this.setPlayBack(episode.episode.videoId, userId, inform, null);
                        if (data) return {...data, position: episode.position};
                    }
                }
            }

        } else if (type === 'EPISODE' && user) {
            const episode = await this.prisma.episode.findUnique({where: {id: mediaId}});
            console.log(episode);
            if (episode)
                return await this.setPlayBack(episode.videoId, userId, inform, null);
        }

        return null;
    }

    /**
     * @desc gets the details of a specific media related to a user in the database
     * @param mediaId - the id of the media to query the database for
     * @param userId - the id of the user to query the database for
     */
    public async getSpecificMediaInfo(mediaId: number, userId: string): Promise<SpringMedUserSpecifics | null> {
        const media = await this.prisma.media.findUnique({where: {id: mediaId}});
        const user = await this.prisma.user.findUnique({
            where: {userId},
            include: {lists: true, ratings: true, watched: true}
        });

        if (media && user) {
            const myList = user.lists.some(item => item.mediaId === mediaId);
            let rating = ((user.ratings.find(item => item.mediaId === mediaId)?.rate || 0) * 10).toFixed(0);
            rating = rating === '0' ? '5%' : rating + '%';

            const seen = await this.mediaClass.checkIfSeen(mediaId, userId);

            const canEdit = user.role === Role.ADMIN;
            const download = canEdit && media.type === MediaType.SHOW;
            const favorite = false;

            return {seen, myList, rating, download, favorite, canEdit};
        }

        return null;
    }

    /**
     * @desc marks the media as watched in the database for a user
     * @param mediaId - media identifier
     * @param userId - user identifier
     */
    public async markAsSeen(mediaId: number, userId: string) {
        const media = await this.prisma.media.findUnique({
            where: {id: mediaId},
            include: {episodes: {include: {video: true}}}
        });
        const user = await this.prisma.user.findUnique({where: {userId}, include: {watched: true}});

        if (media && user) {
            const seen = await this.mediaClass.checkIfSeen(mediaId, userId);
            await this.prisma.watched.deleteMany({where: {userId, mediaId}});

            if (seen) {
                return {seen: false, finished: 0};

            } else {
                if (media.type === MediaType.SHOW) {
                    const data = media.episodes.map(e => {
                        return {
                            userId,
                            mediaId,
                            videoId: e.video.id,
                            position: 1000,
                            episodeId: e.id,
                            finished: 2,
                            times: 1,
                            updated: new Date()
                        }
                    })
                    await this.prisma.watched.createMany({data});

                } else {
                    const video = await this.prisma.video.findMany({where: {mediaId}});
                    const data = video.map(e => {
                        return {
                            userId,
                            mediaId,
                            videoId: e.id,
                            position: 1000,
                            episodeId: null,
                            finished: 1,
                            times: 1,
                            updated: new Date()
                        }
                    })

                    await this.prisma.watched.createMany({data});
                }

                return {seen: true, finished: media.type === MediaType.MOVIE ? 1 : 2};
            }
        }

        return null;
    }

    /**
     * @desc gets the displayable information for all the playlists of a user
     * @param userId - user identifier
     */
    public async getAllPlaylists(userId: string): Promise<Array<Omit<FramesPlaylist, 'videos'> & {videos: number[]}>> {
        const playlist = await this.prisma.playlist.findMany({
            where: {AND: [{userId}, {NOT: {generator: Generator.FRAMES}}]},
            include: {playlistVideos: {orderBy: {id: 'asc'}, include: {video: {include: {media: true}}}}},
            orderBy: {created: 'desc'}
        });

        return playlist.map(e => {
            const {name, identifier, isPublic, overview, generator, playlistVideos} = e;
            const {media} = playlistVideos[0].video;
            const videos = playlistVideos.map(e => e.video.id);
            const location = `/watch?playlistId=${playlistVideos[0].id}`;
            return {
                location,
                timestamp: this.compareDates(e.created),
                identifier, isPublic, overview, generator, name,
                backdrop: media.backdrop, logo: media.logo, videos
            }
        })
    }

}

export class FramesCast extends PlayBack {

    /**
     * @desc creates a frame for the specific auth
     * @param cypher - the cypher to be used
     * @param auth - the auth to be used
     * @param userId - the user identifier
     * @param position - the position of the frame
     */
    async createFrame(cypher: string, auth: string, userId: string, position: number): Promise<boolean> {
        const authFile = await this.prisma.view.findUnique({where: {auth}});
        const user = await this.prisma.user.findUnique({where: {userId}});

        if (authFile && user && user.role !== 'GUEST') {
            await this.prisma.frame.create({
                data: {
                    userId, auth, position, cypher, accessed: 0, created: new Date(), updated: new Date()
                }
            });

            return true
        }

        return false;
    }

    /**
     * @desc decrypts the cypher of a specific frame to it's auth and position
     * @param cypher - the cypher to be decrypted
     */
    async decryptCipher(cypher: string): Promise<SpringPlay | null> {
        const user = await this.prisma.user.findUnique({where: {email: 'guest@frames.local'}});
        const frame = await this.prisma.frame.findUnique({
            where: {cypher}, include: {view: true}
        });

        if (frame && user) {
            await this.prisma.frame.update({
                data: {accessed: frame.accessed + 1}, where: {id: frame.id}
            })
            const inform = frame.view.inform ? frame.position !== 0 : false;
            const data = await this.getPlayBack(frame.view.auth, user.userId, inform);
            if (data) return {...data, position: frame.position, frame: true}
        }

        return null;
    }

    /**
     * @desc adds a generated room to the database
     * @param roomKey - the room key
     * @param auth - the auth of the room
     * @param userId - the user identifier
     */
    async createModRoom(roomKey: string, auth: string, userId: string) {
        const authFile = await this.prisma.view.findUnique({where: {auth}});
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (authFile && user && user.role !== 'GUEST') {
            await this.prisma.room.upsert({
                create: {auth, roomKey}, update: {auth}, where: {roomKey}
            });

            return true;
        }

        return false;
    }

    /**
     * @desc updates a specific room
     * @param userId - the user identifier
     * @param roomKey - the room key
     * @param auth - the auth of the room
     */
    async updateModRoom(userId: string, roomKey: string, auth: string) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user && user.role !== 'GUEST') {
            await this.prisma.room.update({
                data: {auth}, where: {roomKey}
            });

            return true;
        }

        return false;
    }

    /**
     * @desc gets a room from the room key provided
     * @param roomKey - the room key
     * @param userId - the user identifier
     */
    async decryptRoom(roomKey: string, userId: string): Promise<SpringPlay | null> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const frame = await this.prisma.room.findUnique({
            where: {roomKey}, include: {view: true}
        });

        if (frame && user) {
            const play = await this.getPlayBack(frame.view.auth, userId, frame.view.inform);
            if (play) return {...play, position: 0, inform: false};
        }

        return null;
    }
}
