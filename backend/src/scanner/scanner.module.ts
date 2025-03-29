import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';


import { ScanStorageQueueConfig } from './scanner.constants';
import { ScannerController } from './scanner.controller';
import { ScannerIdentifier } from './scanner.identifier';
import { ScannerProcessor } from './scanner.processor';
import { ScannerService } from './scanner.service';
import { ImagesModule } from '../images/images.module';

@Module({
    imports: [
        ImagesModule,
        BullModule.registerQueue(ScanStorageQueueConfig),
    ],
    controllers: [ScannerController],
    providers: [ScannerIdentifier, ScannerService, ScannerProcessor],
})
export class ScannerModule {}
