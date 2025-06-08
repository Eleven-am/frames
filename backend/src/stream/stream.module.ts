import { Module } from '@nestjs/common';

import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { HLSService } from "./hls.service";


@Module({
    controllers: [StreamController],
    providers: [StreamService, HLSService],
    exports: [StreamService, HLSService],
})
export class StreamModule {}
