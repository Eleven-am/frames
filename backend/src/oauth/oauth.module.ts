import { Module } from '@nestjs/common';

import { OauthAuthorizer } from './oauth.authorizer';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';

@Module({
    providers: [OauthService, OauthAuthorizer],
    exports: [OauthService],
    controllers: [OauthController],
})
export class OauthModule {}
