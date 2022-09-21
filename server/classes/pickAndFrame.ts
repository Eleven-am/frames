import Playback, {SpringPlay} from "./playback";
import {PickType} from '@prisma/client';
import {SpringMedia} from "./media";

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

export type SectionType = "EDITOR" | 'BASIC' | 'SECTION'

export type SectionPick<T> = T extends 'BASIC' ? { data: Pick<SpringMedia, 'id' | 'type' | 'name' | 'poster'>[], type: PickType, display: string } : T extends 'EDITOR' ? { data: Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'>[], type: PickType, display: string } : never;

export type UpdateSearch = Pick<SpringMedia, 'name' | 'poster' | 'backdrop' | 'logo' | 'type' | 'tmdbId' | 'id' | 'overview'>

export default class PickAndFrame extends Playback {

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
            where: {category: picks[0].category}, data: {active: false}
        });
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
            overview = (temps[0] || last).display + ' includes ' + overview;
            const poster = (temps[0] || last).media.poster;
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
                display: (temps[0] || last).display,
                picks: media,
                type: (temps[0] || last).type,
                active: (temps[0] || last).active
            });
        }

        return data;
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
            distinct: ['category'], where: {
                AND: [{type}, {NOT: {category: 'selected_trending'}}]
            },
        });

        if (number <= picks.length) return await this.getCategory(picks[number - 1].category);

        else return {data: [], type: PickType.BASIC, display: ''};
    }

    /**
     * @desc Deletes a pick from the database by category
     * @param category - category to be deleted
     */
    public async deletePick(category: string) {
        await this.prisma.pick.deleteMany({where: {category}});
    }

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
