import { Module } from '@nestjs/common';

import { HLSService } from './hls.service';
import { StreamController } from './stream.controller';
import { StreamProcessor } from './stream.processor';
import { StreamService } from './stream.service';


@Module({
    controllers: [StreamController],
    providers: [StreamService, HLSService, StreamProcessor],
    exports: [StreamService, HLSService],
})
export class StreamModule {}
