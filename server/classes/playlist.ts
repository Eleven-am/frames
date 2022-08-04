import Playback, {SpringPlay} from "./playback";
import {Generator, MediaType} from "@prisma/client";
import {WithRequired} from "./auth";
import User from "./user";

export interface PlayListResponse {
    id: number;
    videoId: number;
    identifier: string;
    playList: string;
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
    owner: boolean;
    sharedWith: string[];
    playlistOwner: string;
}

export interface FramesSingularPlaylist {
    name: string;
    identifier: string;
    timestamp: string;
    location: string;
    shuffleLocation: string;
    overview: string;
    media: {
        name: string;
        identifier: number;
        episodeName: string | null;
        logo: string | null;
        backdrop: string;
    }[];
}

export default class Playlist extends Playback {

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
        let playlist = await this.prisma.playlist.findUnique({where: {identifier}});
        if (playlist && playlist.userId === userId)
            playlist = await this.prisma.playlist.update({
                data: {isPublic, overview, name, created: new Date(), generator},
                where: {id: playlist.id}
            })

        else if (playlist === null)
            playlist = await this.prisma.playlist.create({
                data: {isPublic, overview, name, created: new Date(), identifier, userId, generator}
            });

        if (playlist) {
            await this.prisma.playlistVideo.deleteMany({where: {playlistId: playlist.identifier}});
            await this.prisma.playlistVideo.createMany({
                data: videos.map(video => ({
                    playlistId: identifier, videoId: video,
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
                userId, name, identifier, generator, isPublic, overview, created: new Date(),
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
            const videos = this.shuffle(media.videos, media.videos.length, 0);
            const shuffle = videos.map(e => e.id);
            const overview = `Frames generated a shuffled playlist for ${media.name}: ${media.overview}`;
            const identifier = await this.createPlaylists(shuffle, 'shuffle', userId, overview, Generator.FRAMES);
            return await this.findFirstVideo(identifier, userId);
        }

        return null;
    }

    /**
     * @desc generates a shuffled playlist of a provided playlist
     * @param playlistId - playlist identifier for which videos would be shuffled
     * @param userId - user identifier
     */
    public async shufflePlaylist(playlistId: string, userId: string): Promise<PlayListResponse | null> {
        if (await this.canUserAccessPlaylist(userId, playlistId, 'READ')) {
            const playlist = await this.prisma.playlist.findUnique({where: {identifier: playlistId}, include: {playlistVideos: {include: {video: true}}}});
            if (playlist) {
                const videos = this.shuffle(playlist.playlistVideos.map(e => e.video), playlist.playlistVideos.length, 0);
                const shuffle = videos.map(e => e.id);
                const overview = `Frames generated a shuffled playlist for ${playlist.name}: ${playlist.overview}`;
                const identifier = await this.createPlaylists(shuffle, 'shuffle', userId, overview, Generator.FRAMES);
                return await this.findFirstVideo(identifier, userId);
            }
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
                where: {identifier}, data: {
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
        const playlist = await this.prisma.playlist.findUnique({where: {identifier}, include: {sharedWith: true}});
        const next = await this.prisma.playlistVideo.findFirst({where: {playlistId: identifier}, orderBy: {id: 'asc'}});
        if (playlist && next && await this.canUserAccessPlaylist(userId, identifier, 'READ'))
            return {
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
            where: {identifier}, include: {
                sharedWith: {include: {user: true}},
                playlistVideos: {orderBy: {id: 'asc'}, include: {video: {include: {media: true, episode: true}}}},
                user: true
            }
        });

        if (playlist && await this.canUserAccessPlaylist(userId, identifier, 'READ')) {
            const name = playlist.name;
            const playlistVideos = playlist.playlistVideos;

            const videos: FramePlaylistVideo[] = playlistVideos.map(v => {
                const {media, episode} = v.video;
                return {
                    id: v.videoId,
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
                logo: videos[0]?.logo, owner: playlist.userId === userId,
                timestamp: this.compareDates(playlist.created),
                location: `/watch?identifier=${identifier}`,
                sharedWith: playlist.sharedWith.map(e => e.user.email.split('@')[0]),
                playlistOwner: playlist.user.email.split('@')[0],
            }
        }

        return {
            name: '', identifier, videos: [],
            isPublic: false, playlistOwner: '',
            generator: Generator.USER, overview: '',
            backdrop: '', logo: '', owner: true,
            timestamp: '', location: '', sharedWith: [],
        }
    }

    /**
     * @desc gets all the videos in the FramePlaylistVideo format from a specific media
     * @param mediaId - the media identifier
     */
    public async getVideosForMedia(mediaId: number): Promise<{ data: FramePlaylistVideo[], name: string }> {
        const videos = await this.prisma.video.findMany({where: {mediaId}, include: {media: true, episode: true}});

        const data = videos.map(v => {
            const {media, episode} = v;
            return {
                id: v.id,
                overview: episode?.overview || media.overview,
                name: episode ? `${media.name}, S${episode.seasonId}: E${episode.episode}` : media.name,
                backdrop: media.backdrop,
                logo: media.logo,
                type: media.type,
            }
        })

        const name = videos[0]?.media.name || '';
        return {data, name};
    }

    /**
     * @desc gets the information in the FramePlaylistVideo format of a specific video
     * @param videoId - the video identifier
     */
    public async getVideoForPlaylist(videoId: number): Promise<{ data: FramePlaylistVideo, name: string } | null> {
        const video = await this.prisma.video.findUnique({where: {id: videoId}, include: {media: true, episode: true}});

        if (video) {
            const {media, episode} = video;
            const data: FramePlaylistVideo = {
                id: video.id,
                overview: episode?.overview || media.overview,
                name: episode ? `${media.name}, S${episode.seasonId}: E${episode.episode}` : media.name,
                backdrop: media.backdrop,
                logo: media.logo,
                type: media.type,
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
                    let collection = await this.prisma.media.findMany({
                        where: {
                            collection: {
                                path: ['id'], equals: itemId
                            }
                        }, orderBy: {release: 'asc'}, include: {videos: true}
                    });

                    collection = this.shuffle(collection, collection.length, 0);
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

        if (playVideo && await this.canUserAccessPlaylist(userId, playVideo.playlist.identifier, 'READ')) {
            const inform = playVideo.playlist.name !== 'shuffle';
            console.log('generatePlayback', playVideo.video);
            const data = await this.setPlayBack(playVideo.video.id, userId, inform, playlistId);
            console.log('generatePlayback', data);
            if (data) return {...data, playlistId, position: 0};
        }

        return null;
    }

    /**
     * @desc gets the displayable information for all the playlists of a user
     * @param userId - user identifier
     * @param type - playlist type
     */
    public async getAllPlaylists(userId: string, type: 'PLAYLISTS' | 'SHARED' | 'PUBLIC'): Promise<FramesSingularPlaylist[]> {
        const user = await this.prisma.user.findUnique({
            where: {userId}, include: {
                playlist: {
                    orderBy: {created: 'desc'},
                    include: {
                        playlistVideos: {
                            orderBy: {id: 'asc'},
                            include: {video: {include: {media: true, episode: true}}}
                        }, sharedWith: true
                    },
                }, sharedWith: {
                    include: {
                        playlist: {
                            include: {
                                playlistVideos: {
                                    orderBy: {id: 'asc'},
                                    include: {video: {include: {media: true, episode: true}}}
                                }
                            }
                        }
                    },
                }
            }
        });

        if (user) {
            switch (type) {
                case 'PLAYLISTS':
                    return user.playlist.filter(e => e.generator === Generator.USER).map(e => {
                        const {name, identifier, overview, playlistVideos} = e;
                        const media = playlistVideos.map(e => {
                            const {video, id} = e;
                            const {media, episode} = video;
                            return {
                                backdrop: episode?.backdrop || media.backdrop,
                                logo: media.logo, name: media.name, identifier: id,
                                episodeName: episode ? episode.name : null,
                            }
                        })
                        const location = `/watch?identifier=${identifier}`;
                        const shuffleLocation = `/watch?shufflePlaylist=${identifier}`;

                        return {
                            location, shuffleLocation, media,
                            timestamp: this.compareDates(e.created),
                            identifier, overview: overview!, name,
                        }
                    })

                case 'SHARED':
                    return user.sharedWith.map(e => {
                        const {name, identifier, overview, playlistVideos} = e.playlist;
                        const items = playlistVideos.map(e => {
                            const {video, id} = e;
                            const {media, episode} = video;
                            return {
                                backdrop: media.backdrop,
                                logo: media.logo, name: media.name, identifier: id,
                                episodeName: episode ? episode.name : null,
                            }
                        })
                        const location = `/watch?identifier=${identifier}`;
                        const shuffleLocation = `/watch?shufflePlaylist=${identifier}`;
                        return {
                            location, shuffleLocation, media: items,
                            timestamp: this.compareDates(e.created),
                            identifier, overview: overview!, name,
                        }
                    })

                case 'PUBLIC':
                    const publicPlaylists = await this.prisma.playlist.findMany({
                        where: {isPublic: true},
                        orderBy: {created: 'desc'},
                        include: {
                            playlistVideos: {
                                orderBy: {id: 'asc'},
                                include: {video: {include: {media: true, episode: true}}}
                            }
                        }
                    });
                    return publicPlaylists.map(e => {
                        const {name, identifier, overview, playlistVideos} = e;
                        const media = playlistVideos.map(e => {
                            const {video, id} = e;
                            const {media, episode} = video;
                            return {
                                backdrop: episode?.backdrop || media.backdrop,
                                logo: media.logo, name: media.name, identifier: id,
                                episodeName: episode ? episode.name : null,
                            }
                        })
                        const location = `/watch?identifier=${identifier}`;
                        const shuffleLocation = `/watch?shufflePlaylist=${identifier}`;
                        return {
                            location, shuffleLocation, media,
                            timestamp: this.compareDates(e.created),
                            identifier, overview: overview!, name,
                        }
                    });
            }
        }

        return [];
    }

    /**
     * @desc shared playlist with a user by their email address and the playlist identifier
     * @param email - email address of the user to share with
     * @param playlistId - playlist identifier
     * @param userId - user identifier
     */
    public async sharePlaylist(userId: string, playlistId: string, email: string): Promise<{ error?: string, response?: string }> {
        const playlist = await this.prisma.playlist.findUnique({
            where: {identifier: playlistId},
            include: {playlistVideos: {include: {video: {include: {media: true}}}}}
        });
        const recipient = await this.prisma.user.findUnique({where: {email}});
        const sender = await this.prisma.user.findUnique({where: {userId}});
        const user = new User();
        if (playlist && sender) {
            if (playlist.userId === userId) {
                if (recipient) {
                    await this.prisma.sharedWith.create({
                        data: {
                            playlistId, email, created: new Date()
                        }
                    });

                    const title = 'New playlist shared with you';
                    const message = `${sender.email.split('@')[0]} just shared their new playlist: ${playlist.name} with you`;
                    const image = playlist.playlistVideos[0].video.media.poster || '';
                    const type = 'playlistInvite';
                    const url = `/playlist?identifier=${playlistId}`;
                    await user.sendMessage(recipient.userId, message, title, image, url, type, sender.email);
                    return {response: 'Playlist shared successfully'};

                } else
                    return {error: 'User not found'};

            } else
                return {error: 'You do not have permission to share this playlist'};

        } else
            return {error: 'Playlist not found'};
    }

    /**
     * @desc gets a video from within a playlist for playback
     * @param videoId - video identifier
     * @param identifier - playlist identifier
     */
    public async getVideoForPlayback(videoId: number, identifier: string): Promise<PlayListResponse | null> {
        const video = await this.prisma.playlistVideo.findFirst({
            where: {videoId, playlistId: identifier},
            include: {playlist: true}
        });

        if (video) {
            return {
                playList: video.playlist.name,
                identifier: video.playlist.identifier,
                videoId: video.videoId, id: video.id,
            }
        }

        return null;
    }

    /**
     * @desc checks if a user has the required permissions to access a playlist
     * @param userId - user identifier
     * @param playlistId - playlist identifier
     * @param type - type of access required
     * @private
     */
    private async canUserAccessPlaylist(userId: string, playlistId: string, type: 'READ' | 'WRITE'): Promise<boolean> {
        const playlist = await this.prisma.playlist.findUnique({
            where: {identifier: playlistId},
            include: {sharedWith: true}
        });
        const user = await this.prisma.user.findUnique({where: {userId}});

        switch (type) {
            case 'READ':
                if (playlist && user)
                    return playlist.sharedWith.some(sharedWith => sharedWith.email === user.email) || playlist.userId === user.userId || playlist.isPublic;
                else
                    return false;
            case 'WRITE':
                if (playlist && user)
                    return playlist.userId === user.userId;
                else
                    return false;
        }
    }
}
