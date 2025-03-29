import { BullModule } from '@nestjs/bullmq';
import { Module, Global } from '@nestjs/common';


import { PlaybackAuthorizer } from './playback.authorizer';
import { PlaybackController } from './playback.controller';
import { PlaybackService } from './playback.service';
import { StreamQueueConfig } from '../stream/stream.constants';
import { StreamModule } from '../stream/stream.module';

@Global()
@Module({
    imports: [
        StreamModule,
        BullModule.registerQueue(StreamQueueConfig),
    ],
    controllers: [PlaybackController],
    providers: [PlaybackService, PlaybackAuthorizer],
    exports: [PlaybackService],
})
export class PlaybackModule {}
