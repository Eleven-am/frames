import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';


import { StreamAuthorizer } from './stream.authorizer';
import { StreamQueueConfig } from './stream.constants';
import { StreamController } from './stream.controller';
import { StreamProcessor } from './stream.processor';
import { StreamService } from './stream.service';
import { ScanStorageQueueConfig } from '../scanner/scanner.constants';


@Module({
    imports: [
        BullModule.registerQueue(ScanStorageQueueConfig),
        BullModule.registerQueue(StreamQueueConfig),
    ],
    controllers: [StreamController],
    providers: [StreamService, StreamAuthorizer, StreamProcessor],
    exports: [StreamService],
})
export class StreamModule {}
