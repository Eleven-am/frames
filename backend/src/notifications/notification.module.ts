import { Global, Module } from '@nestjs/common';

import { LogChannel } from './log.channel';
import { MailerService } from './mailer.service';
import { NotificationChannel } from './notification.channel';
import { NotificationService } from './notification.service';

@Global()
@Module({
    controllers: [],
    providers: [NotificationChannel, LogChannel, NotificationService, MailerService],
    exports: [NotificationService],
})
export class NotificationModule {}
