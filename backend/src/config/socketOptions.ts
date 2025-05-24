import { AuthorizationSocketGuard } from '@eleven-am/authorizer';
import { Metadata } from '@eleven-am/pondsocket-nest';
import { ConfigService } from '@nestjs/config';
import { REDIS_HOST, REDIS_PORT, REDIS_DB } from './constants';

export const socketOptions: Metadata = {
    isGlobal: true,
    guards: [AuthorizationSocketGuard],
    /*inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        host: configService.getOrThrow<string>(REDIS_HOST),
        port: parseInt(configService.getOrThrow<string>(REDIS_PORT), 10),
        db: parseInt(configService.getOrThrow<string>(REDIS_DB), 10),
    }),*/
};
