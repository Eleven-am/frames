import type { PondChannel } from '@eleven-am/pondsocket/types';
import { Channel, ChannelInstance, OnJoinRequest } from '@eleven-am/pondsocket-nest';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { SOCKET_LOG_CHANNEL } from './notification.constants';
import { LogStream, SocketNotification } from './notification.schema';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';


@Injectable()
@Channel(SOCKET_LOG_CHANNEL)
export class LogChannel {
    @ChannelInstance()
    readonly channel: PondChannel;

    @OnJoinRequest()
    onJoinRequest (@CurrentSession.HTTP() session: CachedSession) {
        if (session.user.role !== Role.ADMIN) {
            throw new UnauthorizedException('You are not authorized to join this channel');
        }

        return {
            assigns: {
                userId: session.user.id,
            },
        };
    }

    sendStream (message: LogStream) {}

    sendNotification (message: SocketNotification) {}
}
