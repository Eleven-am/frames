import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_URL } from '../config/constants';
import { extendPrisma, ExtendedPrisma } from './prisma.extension';

const ExtendedPrismaClient = class {
    constructor (datasourceUrl: string) {
        // eslint-disable-next-line no-constructor-return
        return extendPrisma(datasourceUrl);
    }
} as new (datasourceUrl: string) => ExtendedPrisma;

@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor (configService: ConfigService) {
        super(configService.getOrThrow<string>(DATABASE_URL));
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
