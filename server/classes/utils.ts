import {PrismaClient} from '@prisma/client';

// @ts-ignore
const prisma = global.prisma || new PrismaClient();

export {prisma};