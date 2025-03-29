import { Module } from '@nestjs/common';

import { AuthKeyAuthorizer } from './authkey.authorizer';
import { AuthKeyController } from './authkey.controller';
import { AuthKeyService } from './authkey.service';

@Module({
    controllers: [AuthKeyController],
    providers: [AuthKeyService, AuthKeyAuthorizer],
    exports: [AuthKeyService],
})
export class AuthKeyModule {}
