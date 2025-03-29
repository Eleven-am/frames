import { Module } from '@nestjs/common';

import { PicksAuthorizer } from './picks.authorizer';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';

@Module({
    controllers: [PicksController],
    providers: [PicksService, PicksAuthorizer],
})
export class PicksModule {}
