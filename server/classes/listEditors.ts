import {prisma} from '../base/utils';
import {generateKey} from "../base/baseFunctions";
import {MediaSection} from "./media";
import {SectionInterface} from "./playback";
import {Generator, PickType, MediaType} from '@prisma/client';

export interface PickMedia {
    id: number;
    type: MediaType;
    backdrop: string;
    poster: string;
    logo: string;
    name: string;
}

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

export interface PicksList {
    category: string;
    display: string;
    poster: string;
    overview: string;
}

export interface EditPickInterface {
    type: PickType;
    active: boolean;
    display: string;
    category: string;
    media: PickMedia[]
}

export class ListEditors {

    /**
     * @param userId user identifier
     * @returns media added by user to their list
     */
    async getMyList(userId: string): Promise<SectionInterface> {
        let myList = await prisma.listItem.findMany({where: {userId}, include: {media: true}});

        return {
            type: 'basic', data: myList.map(item => {
                let list = item.media;
                return {
                    updated: item.updated,
                    background: list.background,
                    id: list.id, poster: list.poster,
                    type: list.type, name: list.name
                }
            }).sortKey('updated', false), display: 'my list'
        };
    }

    /**
     * @description attempts to add media to user's list if abscent or deletes if present
     * @param mediaId media identifier
     * @param userId user identifier
     * @returns true if added false if removes
     */
    async addToList(mediaId: number, userId: string): Promise<boolean> {
        let media = await prisma.media.findFirst({where: {id: mediaId}});
        let list = await prisma.listItem.findFirst({where: {mediaId, userId}});
        if (media) {
            if (list) {
                await prisma.listItem.delete({where: {id: list.id}});
                return false;

            } else {
                await prisma.listItem.create({
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
     * @param category category identifier
     * @returns Array of media element in a category
     */
    async getCategory(category: string): Promise<SectionInterface> {
        let pick = await prisma.pick.findMany({where: {category}, include: {media: true}});
        if (pick[0]?.type === PickType.BASIC) {
            let data: MediaSection[] = pick.map(item => {
                return {
                    background: item.media.background,
                    id: item.media.id, name: item.media.name,
                    poster: item.media.poster, type: item.media.type
                }
            })

            let display = pick.length ? pick[0].display : category;
            return {display, data, type: 'basic'};
        } else {
            let data: MediaSection[] = pick.map(item => {
                return {
                    id: item.media.id, name: item.media.name, logo: item.media.logo,
                    backdrop: item.media.backdrop, type: item.media.type
                }
            })

            let display = pick.length ? pick[0].display : category;
            return {display, data, type: 'editor'};
        }
    }

    /**
     * @description adds a list of media to the database
     * @param data a number array containing the mediaId of the media to be added
     * @param category the cypher string to request the pick on load
     * @param display the information diaplayed for the pick
     * @param type
     * @param active
     */
    async addPick(data: number[], category: string, display: string, type: PickType, active: boolean) {
        display = display.toLowerCase();
        category = category.toLowerCase();
        await prisma.pick.deleteMany({where: {category}});
        if (type === PickType.BASIC)
            await prisma.pick.deleteMany({where: {type: PickType.BASIC}});

        let res = data.map(e => {
            return {
                mediaId: e, display, category,
                active, type,
            }
        })

        await prisma.pick.createMany({data: res});
        let picks = await prisma.pick.findMany({
            distinct: ['category'],
            orderBy: {id: 'asc'},
            where: {AND: [{active: true}, {NOT: {category}}]}
        });

        if (picks.length > 1 && active)
            await prisma.pick.updateMany({where: {category: picks[0].category}, data: {active: false}});
    }

    /**
     * @desc sets rate value on a media for a user
     * @param mediaId
     * @param userId
     * @param rate
     */
    async rateThis(mediaId: number, userId: string, rate: number): Promise<boolean> {
        let list = await prisma.rating.findFirst({where: {userId, mediaId}});
        if (list)
            await prisma.rating.update({where: {id: list.id,}, data: {rate}})

        else
            await prisma.rating.create({data: {mediaId, userId, rate}})

        return true;
    }

    /**
     * @desc gets a summary of all the picks available
     */
    async getPicks() {
        const categories = await prisma.pick.findMany({select: {category: true}, distinct: ['category'], orderBy: {category: 'asc'}});
        const picks = await prisma.pick.findMany({include: {media: {select: {poster: true, name: true}}}});

        const data: PicksList[] = [];
        for (let item of categories) {
            let temps = picks.filter(e => e.category === item.category);
            const last = temps.pop();
            let overview = temps.map(e => e.media.name).join(', ') + (last ? ' and ' + last.media.name: '');
            overview = temps[0].display + ' includes ' + overview;
            const poster = temps[0].media.poster;
            data.push({...item, poster, overview, display: temps[0].display})
        }

        return data;
    }

    /**
     * @desc gets a specific editor pick useful for editing
     * @param category
     */
    async getSpecificPick(category: string): Promise<EditPickInterface> {
        let pick = await prisma.pick.findMany({where: {category}, include: {media: true}});
        const type = pick[0]?.type;
        const active = pick.length ? pick[0].active : false;
        const media: {
            id: number;
            type: MediaType;
            backdrop: string;
            poster: string;
            logo: string;
            name: string;
        }[] = pick.map(item => {
            return {
                background: item.media.background,
                id: item.media.id, name: item.media.name,
                poster: item.media.poster, type: item.media.type,
                logo: item.media.logo, backdrop: item.media.backdrop
            }
        })
        const display = pick[0]?.display;
        return {type, media, display, category, active}
    }

    /**
     * @desc return available segments for display
     * @returns {Promise<string[]>}
     */
    async getSegments(): Promise<string[]> {
        let editors = await prisma.pick.findMany({
            distinct: ['category'],
            where: {AND: [{active: true}, {NOT: {type: PickType.BASIC}}]}
        });

        let basic = await prisma.pick.findMany({
            distinct: ['category'],
            where: {type: PickType.BASIC}
        });

        let rows = ['myList', 'continue', 'trending', 'suggestion'];
        if (editors.length && basic.length) {
            rows = [...rows, editors[0].category, basic[0].category, 'seen'];

            if (editors.length > 1)
                rows = [...rows, editors[1].category];

        } else
            rows = [...rows, 'seen'];

        return [...rows, 'added'];
    }
}

export class Playlist {

    /**
     * @desc creates a playlist in the order the videos where provided
     * @param videos a number[] of the videoIds to be added to the playlist
     * @param name user generic name provided for the playlist
     * @param userId
     * @param generator generated automatically by frames or by the user
     */
    async createPlaylists(videos: number[], name: string, userId: string, generator: Generator): Promise<string> {
        const identifier = generateKey(5, 7);
        await prisma.playlist.create({
            data: {
                userId, name, identifier, generator
            }
        });

        const data = videos.map(e => {
            return {videoId: e, playlistId: identifier}
        })

        await prisma.playlistVideos.createMany({data});
        return identifier;
    }

    /**
     * @desc gets the next video in the playlist cue based on the the identifier of the currently playing video
     * @param id
     */
    async retrieveNextVideo(id: number): Promise<PlayListResponse | null> {
        const video = await prisma.playlistVideos.findUnique({where: {id}});
        if (video) {
            const {playlistId} = video;
            const nextVideo = await prisma.playlistVideos.findFirst({
                where: {AND: [{playlistId}, {id: {gt: id}}]},
                include: {playlist: true}
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
     * @desc generates a shuffled playlist of all the episode in a tv show media
     * @param mediaId
     * @param userId
     */
    async shuffleMedia(mediaId: number, userId: string): Promise<PlayListResponse | null> {
        const media = await prisma.media.findFirst({where: {id: mediaId}, include: {videos: true}});
        if (media && media.type === 'SHOW') {
            const videos = media.videos.randomiseDB(media.videos.length, 0);
            const shuffle = videos.map(e => e.id);
            const identifiers = (await prisma.playlist.findMany({
                where: {userId, name: 'shuffle'},
                select: {identifier: true}
            })).map(e => e.identifier);
            await prisma.playlist.deleteMany({where: {identifier: {in: identifiers}}});

            const identifier = await this.createPlaylists(shuffle, 'shuffle', userId, Generator.FRAMES);
            const next = await prisma.playlistVideos.findFirst({where: {playlistId: identifier}});
            if (next)
                return {identifier, playList: 'shuffle', videoId: shuffle[0], id: next.id};
        }

        return null;
    }

    /**
     * @desc adds new videos to an existing playlist
     * @param identifier
     * @param videos
     */
    async addToPlayList(identifier: string, videos: number | number[]) {
        const toAdd = Array.isArray(videos) ? videos : [videos];
        const data = toAdd.map(e => {
            return {videoId: e, playlistId: identifier}
        })

        await prisma.playlistVideos.createMany({data});
    }

    /**
     * @desc gets the first video in the playlist
     * @param identifier
     */
    async findFirstVideo(identifier: string): Promise<PlayListResponse | null> {
        const playList = await prisma.playlist.findUnique({where: {identifier}});
        const next = await prisma.playlistVideos.findFirst({where: {playlistId: identifier}});
        if (next && playList)
            return {
                id: next.id,
                videoId: next.videoId,
                playList: playList.name,
                identifier,
            }

        return null;
    }
}