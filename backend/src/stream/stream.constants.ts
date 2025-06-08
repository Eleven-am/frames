import { InjectQueue } from '@nestjs/bullmq';
import { RegisterQueueOptions } from '@nestjs/bullmq/dist/interfaces/register-queue-options.interface';

export const STREAM_QUEUE_NAME = 'STREAM_QUEUE';

export const HLS_CACHE_DIRECTORY = 'HLS_CACHE_DIRECTORY';

export const StreamQueueConfig: RegisterQueueOptions = {
    name: STREAM_QUEUE_NAME,
};

export const StreamQueue = () => InjectQueue(STREAM_QUEUE_NAME);
