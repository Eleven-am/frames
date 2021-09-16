import {prisma} from "../base/utils";
import Springboard, {SpringPlay} from "./springboard";

const spring = new Springboard();

export default class FramesCast {

    /**
     * @desc creates a frame for the specific auth
     * @param cypher
     * @param auth
     * @param userId
     * @param position
     */
    async createFrame(cypher: string, auth: string, userId: string, position: number): Promise<boolean> {
        const authFile = await prisma.view.findUnique({where: {auth}});
        const user = await prisma.user.findUnique({where: {userId}});

        if (authFile && user && user.role !== 'GUEST') {
            await prisma.frame.create({
                data: {
                    userId, auth, position, cypher,
                    accessed: 0, created: new Date(), updated: new Date()
                }
            });

            return true
        }

        return false;
    }

    /**
     * @desc decrypts the cypher of a specific frame to it's auth and position
     * @param cypher
     * @param userId
     */
    async decryptCipher(cypher: string, userId: string): Promise<SpringPlay | null> {
        const user = await prisma.user.findUnique({where: {userId}});
        const frame = await prisma.frame.findUnique({
            where: {cypher},
            include: {view: {include: {video: {include: {media: true, episode: true}}}}}
        });

        if (frame && user) {
            await prisma.frame.update({
                data: {accessed: frame.accessed + 1},
                where: {id: frame.id}
            })

            const id = frame.view.video.episode ? frame.view.video.episode.id : frame.view.video.media.id;
            const episode = !!frame.view.video.episode;
            const data = await spring.playMedia(id, userId, episode);
            if (data)
                return {...data, position: frame.position === 0 ? data.position : frame.position, frame: true}
        }

        return null;
    }

    /**
     * @desc adds a generated room to the database
     * @param roomKey
     * @param auth
     * @param userId
     */
    async createModRoom(roomKey: string, auth: string, userId: string) {
        const authFile = await prisma.view.findUnique({where: {auth}});
        const user = await prisma.user.findUnique({where: {userId}});
        if (authFile && user && user.role !== 'GUEST') {
            await prisma.room.upsert({
                create: {auth, roomKey},
                update: {auth},
                where: {roomKey}
            });

            return true;
        }

        return false;
    }

    /**
     * @desc gets a room from the room key provided
     * @param roomKey
     * @param userId
     */
    async decryptRoom(roomKey: string, userId: string): Promise<SpringPlay | null>  {
        const user = await prisma.user.findUnique({where: {userId}});
        const frame = await prisma.room.findUnique({
            where: {roomKey},
            include: {view: {include: {video: {include: {media: true, episode: true}}}}}
        });

        if (frame && user) {
            const id = frame.view.video.episode ? frame.view.video.episode.id : frame.view.video.media.id;
            const episode = !!frame.view.video.episode;
            return await spring.playMedia(id, userId, episode);
        }

        return null;
    }
}
