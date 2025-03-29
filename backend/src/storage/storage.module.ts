import { StorageModule as BaseModule } from '@eleven-am/nestjs-storage/dist/module/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';


import { StorageAuthorizer } from './storage.authorizer';
import { AdminEmailProvider } from './storage.constants';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { StorageWatcher } from './storage.watcher';
import { StorageOptions } from '../config/storageOptions';
import { ScanStorageQueueConfig } from '../scanner/scanner.constants';

@Global()
@Module({
    imports: [
        BaseModule.forRoot(StorageOptions),
        BullModule.registerQueue(ScanStorageQueueConfig),
    ],
    controllers: [StorageController],
    providers: [AdminEmailProvider, StorageService, StorageAuthorizer, StorageWatcher],
    exports: [StorageService],
})
export class StorageModule {}
