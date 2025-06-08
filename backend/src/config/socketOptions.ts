import { AuthorizationSocketGuard } from '@eleven-am/authorizer';
import { RedisDistributedBackend } from '@eleven-am/pondsocket';
import { AsyncMetadata } from '@eleven-am/pondsocket-nest';
import { ConfigService } from '@nestjs/config';

import { REDIS_DB, REDIS_HOST, REDIS_PORT } from './constants';

export const socketOptions: AsyncMetadata = {
    isGlobal: true,
    inject: [ConfigService],
    guards: [AuthorizationSocketGuard],
    useFactory: (configService: ConfigService) => new RedisDistributedBackend({
        host: configService.getOrThrow<string>(REDIS_HOST),
        port: parseInt(configService.getOrThrow<string>(REDIS_PORT), 10),
        database: parseInt(configService.getOrThrow<string>(REDIS_DB), 10),
    }),
};
