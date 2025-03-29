import { Module } from '@nestjs/common';

import { DownloadsAuthorizer } from './downloads.authorizer';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { AuthKeyModule } from '../authkey/authkey.module';


@Module({
    imports: [AuthKeyModule],
    controllers: [DownloadsController],
    providers: [DownloadsAuthorizer, DownloadsService],
})
export class DownloadsModule {}
