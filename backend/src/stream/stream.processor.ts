import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Video } from '@prisma/client';
import { Job } from 'bullmq';

import { STREAM_QUEUE_NAME } from './stream.constants';
import { StreamService } from './stream.service';

@Processor(STREAM_QUEUE_NAME, { concurrency: 2 })
export class StreamProcessor extends WorkerHost {
    private readonly logger = new Logger(StreamProcessor.name);

    constructor (private readonly streamService: StreamService) {
        super();
    }

    process (job: Job<Video>) {
        this.logger.log(`Creating thumbnails for video ${job.data.location}`);

        return this
            .streamService
            .produceThumbnails(job.data)
            .ioSync(() => this.logger.log(`Finished creating thumbnails for video ${job.data.location}`))
            .toPromise();
    }
}
