import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';

import { JWT_SECRET } from './constants';

export const JWTOptions: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow(JWT_SECRET),
        signOptions: {
            expiresIn: '7d',
        },
        verifyOptions: {
            ignoreExpiration: false,
        },
    }),
};
