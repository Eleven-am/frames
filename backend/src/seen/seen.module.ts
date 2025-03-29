import { Module } from '@nestjs/common';

import { SeenAuthorizer } from './seen.authorizer';
import { SeenController } from './seen.controller';
import { SeenService } from './seen.service';

@Module({
    controllers: [SeenController],
    providers: [SeenService, SeenAuthorizer],
    exports: [SeenService],
})
export class SeenModule {}
