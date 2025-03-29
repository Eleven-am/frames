import { SharedBullAsyncConfiguration } from '@nestjs/bullmq/dist/interfaces';
import { ConfigService } from '@nestjs/config';

import { REDIS_HOST, REDIS_PORT, REDIS_DB } from './constants';

export const BullOptions: SharedBullAsyncConfiguration = {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        connection: {
            host: configService.getOrThrow<string>(REDIS_HOST),
            port: parseInt(configService.getOrThrow<string>(REDIS_PORT), 10),
            db: parseInt(configService.getOrThrow<string>(REDIS_DB), 10),
        },
        defaultJobOptions: {},
    }),
};
