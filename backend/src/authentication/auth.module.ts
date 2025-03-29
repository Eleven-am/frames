import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthKeyModule } from '../authkey/authkey.module';
import { OauthModule } from '../oauth/oauth.module';
import { SessionModule } from '../session/session.module';


@Module({
    controllers: [AuthController],
    imports: [AuthKeyModule, OauthModule, SessionModule],
    providers: [AuthService],
})
export class AuthModule {}
