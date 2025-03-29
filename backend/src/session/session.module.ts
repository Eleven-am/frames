import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { SessionService } from './session.service';
import { JWTOptions } from '../config/jwtOptions';
import { HttpModule } from '../http/http.module';

@Global()
@Module({
    imports: [
        HttpModule,
        JwtModule.registerAsync(JWTOptions),
    ],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule {}
