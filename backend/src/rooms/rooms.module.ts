import { Module } from '@nestjs/common';

import { RoomsAuthorizer } from './rooms.authorizer';
import { RoomsChannel } from './rooms.channel';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
    controllers: [RoomsController],
    providers: [RoomsService, RoomsChannel, RoomsAuthorizer],
})
export class RoomsModule {}
