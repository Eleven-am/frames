import {prisma} from '../base/utils';
import {generateKey} from "../base/baseFunctions";
import {MediaSection} from "./media";
import {SectionInterface} from "./playback";
import {Generator} from '@prisma/client';

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
        if (category === 'maix') {
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
     */
    async addPick(data: number[], category: string, display: string) {
        let res = data.map(e => {
            return {
                mediaId: e, display, category,
                active: false,
            }
        })

        await prisma.pick.createMany({data: res});
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

    async setActive(categoryOne: string, categoryTwo: string) {
        const one = await prisma.pick.findFirst({where: {category: categoryOne}});
        const two = await prisma.pick.findFirst({where: {category: categoryTwo}});

        if (one && two) {
            await prisma.pick.updateMany({
                data: {active: false}
            })

            await prisma.pick.updateMany({
                data: {active: true},
                where: {category: {in: [categoryOne, categoryTwo]}}
            })
        }
    }
}

export class Playlist {

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

    async shuffleMedia(mediaId: number, userId: string): Promise<PlayListResponse | null> {
        const media = await prisma.media.findFirst({where: {id: mediaId}, include: {videos: true}});
        if (media && media.type === 'SHOW') {
            const videos = media.videos.randomiseDB(media.videos.length, 0);
            const shuffle = videos.map(e => e.id);
            const identifiers = (await prisma.playlist.findMany({
                where: {userId, name: 'shuffle'},
                select: {identifier: true}
            })).map(e => e.identifier);
            const delPlay = prisma.playlist.deleteMany({where: {identifier: {in: identifiers}}});
            const delVid = prisma.playlistVideos.deleteMany({where: {playlistId: {in: identifiers}}});

            await prisma.$transaction([delVid, delPlay]);

            const identifier = await this.createPlaylists(shuffle, 'shuffle', userId, Generator.FRAMES);
            const next = await prisma.playlistVideos.findFirst({where: {playlistId: identifier}});
            if (next)
                return {identifier, playList: 'shuffle', videoId: shuffle[0], id: next.id};
        }

        return null;
    }

    async addToPlayList(identifier: string, videos: number | number[]) {
        const toAdd = Array.isArray(videos) ? videos : [videos];
        const data = toAdd.map(e => {
            return {videoId: e, playlistId: identifier}
        })

        await prisma.playlistVideos.createMany({data});
    }

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