import Magnet from "../classes/magnets";
import DriveHandler from "../classes/driveHandler";
import {PrismaClient} from '@prisma/client';

interface CustomNodeJsGlobal extends NodeJS.Global{
    prisma: PrismaClient;
    drive: DriveHandler;
    magnet: Magnet;
}

declare const global: CustomNodeJsGlobal;
const prisma = global.prisma || new PrismaClient();
const drive = global.drive || new DriveHandler();
const magnet = global.magnet || new Magnet();

export {prisma, magnet, drive};