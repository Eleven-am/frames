import { Module } from '@nestjs/common';

import { FramesAuthorizer } from './frames.authorizer';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';

@Module({
    controllers: [FramesController],
    providers: [FramesService, FramesAuthorizer],
})
export class FramesModule {}

