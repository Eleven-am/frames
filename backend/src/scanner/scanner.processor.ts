import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { Job } from 'bullmq';

import { SCAN_STORAGE_QUEUE_NAME } from './scanner.constants';
import { NewMediaEvent, NewEpisodesEvent, ScanLibraryEvent, LibraryScanType } from './scanner.contracts';
import { ScannerService } from './scanner.service';

@Processor(SCAN_STORAGE_QUEUE_NAME, { concurrency: 2 })
export class ScannerProcessor extends WorkerHost {
    private readonly logger = new Logger(ScannerProcessor.name);

    constructor (private readonly scannerService: ScannerService) {
        super();
    }

    process (job: Job<NewMediaEvent | NewEpisodesEvent | ScanLibraryEvent>) {
        if ('file' in job.data) {
            return this.processScanMediaEvent(job as Job<NewMediaEvent>);
        }

        if ('show' in job.data) {
            return this.processScanEpisodesEvent(job as Job<NewEpisodesEvent>);
        }

        return this.processScanLibraryEvent(job as Job<ScanLibraryEvent>);
    }

    private processScanMediaEvent (job: Job<NewMediaEvent>) {
        this.logger.log(`Processing ${job.data.type} ${job.data.file.path}, media job: ${job.id}`);

        if (job.data.type === MediaType.MOVIE) {
            return this
                .scannerService
                .scanMovie(job.data.file)
                .ioSync(() => this.logger.log(`Finished processing media job: ${job.id} with path ${job.data.file.path}`))
                .toPromise();
        }

        return this
            .scannerService
            .scanShow(job.data.file)
            .ioSync(() => this.logger.log(`Finished processing media job: ${job.id} with path ${job.data.file.path}`))
            .toPromise();
    }

    private processScanEpisodesEvent (job: Job<NewEpisodesEvent>) {
        this.logger.log(`Processing episodes for ${job.data.show.name} job: ${job.id}`);

        return this
            .scannerService
            .scanEpisodesInShow(job.data.show)
            .ioSync(() => this.logger.log(`Finished processing show scan job: ${job.id} with name ${job.data.show.name}`))
            .toPromise();
    }

    private processScanLibraryEvent (job: Job<ScanLibraryEvent>) {
        this.logger.log(`Processing scan ${job.data.type ?? 'ALL'} library job: ${job.id}`);

        if (job.data.type === LibraryScanType.ALL) {
            return this
                .scannerService
                .scanStorage(job.data.library);
        }

        if (job.data.type === LibraryScanType.MOVIE) {
            return this
                .scannerService
                .scanMovies(job.data.library)
                .ioSync(() => this.logger.log(`Finished processing movie job: ${job.id} of library ${job.data.library.name}`))
                .toPromise();
        }

        return this
            .scannerService
            .scanShows(job.data.library)
            .ioSync(() => this.logger.log(`Finished processing shows job: ${job.id} of library ${job.data.library.name}`))
            .toPromise();
    }
}
