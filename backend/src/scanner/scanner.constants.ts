import { InjectQueue } from '@nestjs/bullmq';
import { RegisterQueueOptions } from '@nestjs/bullmq/dist/interfaces/register-queue-options.interface';

export const STORAGE_ADDED_EVENT = 'STORAGE_ADDED_EVENT';
export const EPISODES_CHANGED_EVENT = 'MEDIA_ADDED_EVENT';
export const SCAN_STORAGE_QUEUE_NAME = 'SCAN_STORAGE_QUEUE';
export const ScanStorageQueueConfig: RegisterQueueOptions = {
    name: SCAN_STORAGE_QUEUE_NAME,
};
export const ScanQueue = () => InjectQueue(SCAN_STORAGE_QUEUE_NAME);
