import { createUnauthorizedError } from '@eleven-am/fp';
import type { PondChannel } from '@eleven-am/pondsocket/types';
import { Channel, ChannelInstance, OnEvent, OnJoinRequest } from '@eleven-am/pondsocket-nest';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { PresenceChangeSchema } from './notification.args';
import { NOTIFICATION_CHANNEL } from './notification.constants';
import { NotificationEventMap, NotificationReturnType, NotificationSchema } from './notification.schema';
import { NotificationService } from './notification.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';
import { GetValidPayload } from '../socket/socket.decorators';
import { Assigns, MetaData, PresenceInterface } from '../socket/socket.schema';


@Injectable()
@Channel(NOTIFICATION_CHANNEL)
export class NotificationChannel {
    @ChannelInstance()
    readonly channel: PondChannel<NotificationEventMap, PresenceInterface<MetaData>, Assigns>;

    constructor (
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {}

    @OnJoinRequest()
    onJoinRequest (@CurrentSession.WS() session: CachedSession) {
        if (session.user.revoked) {
            throw createUnauthorizedError('User has been revoked');
        }

        const presence = {
            isIncognito: session.user.incognito,
            username: session.user.username,
            channel: session.user.channel,
            browserId: session.browserId,
            onlineAt: Date.now(),
            metadata: null,
            status: 'online',
        };

        return {
            presence,
        };
    }

    @OnEvent('presence')
    onPresence (@CurrentSession.WS() session: CachedSession, @GetValidPayload() payload: PresenceChangeSchema): NotificationReturnType<'noResponse'> {
        return {
            presence: {
                status: payload.metadata?.action || 'online',
                isIncognito: session.user.incognito,
                username: session.user.username,
                channel: session.user.channel,
                browserId: session.browserId,
                metadata: payload.metadata,
                onlineAt: Date.now(),
            },
        };
    }

    @OnEvent('notification')
    onNotification (@GetValidPayload() payload: NotificationSchema) {
        this.notificationService.sendSocketNotification(payload.notification);
    }
}
