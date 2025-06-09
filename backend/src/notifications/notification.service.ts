import React from 'react';

import { createInternalError, Either, TaskEither } from '@eleven-am/fp';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Role, Session, User } from '@prisma/client';
import { render } from '@react-email/render';

import { LogChannel } from './log.channel';
import { MailerService } from './mailer.service';
import { NotificationChannel } from './notification.channel';
import { NOTIFICATION_CHANNEL } from './notification.constants';
import { NotificationData, SocketActionNotification, SocketNotification } from './notification.schema';
import { EmailResponseSchema } from '../authentication/auth.contracts';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';
import { MetaData } from '../socket/socket.schema';
import { ResetEmail } from './templates/reset-password';
import { VerifyEmail } from './templates/verify-email';


@Injectable()
export class NotificationService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly logChannel: LogChannel,
        private readonly mailService: MailerService,
        @Inject(forwardRef(() => NotificationChannel))
        private readonly notificationChannel: NotificationChannel,
    ) {}

    getAllPresences () {
        const channel = this.notificationChannel.channel.getChannel(NOTIFICATION_CHANNEL);

        if (!channel) {
            return [];
        }

        return Object.values(channel.getPresences());
    }

    getMetadata (session: CachedSession) {
        return Either
            .tryCatch(
                () => this.getAllPresences(),
                'Failed to get presences',
            )
            .filterItems((presence) => presence.username === session.user.username && presence.browserId !== session.browserId)
            .mapItems(({ metadata }) => metadata)
            .map((items) => items.filter((metadata): metadata is MetaData => Boolean(metadata)))
            .toTaskEither();
    }

    updatePresence (session: CachedSession, metadata: MetaData, status: string) {
        return this.retrieveChannelAndSocketId(session.browserId, false)
            .map(({ channel, socketIds: [socketId] }) => channel.upsertPresence(socketId, {
                isIncognito: session.user.incognito,
                username: session.user.username,
                channel: session.user.channel,
                browserId: session.browserId,
                onlineAt: Date.now(),
                metadata,
                status,
            }))
            .toResult();
    }

    sendVerificationEmail (user: Omit<User, 'password'>, ip: string, device: string, endpoint: string) {
        return TaskEither
            .of(user)
            .filter(
                (user: Omit<User, 'password'>) => user.role !== 'OAUTH' && !user.confirmedEmail,
                () => createInternalError(
                    `Unable to send email verification for user ${user.id}: user has been verified by oauth provider`,
                ),
            )
            .chain((user) => this.sendEmail(
                user.email,
                'Verify your email',
                VerifyEmail({
                    token: user.confirmToken!,
                    username: user.username,
                    deviceName: device,
                    inviteFromIp: ip,
                    endpoint,
                }),
            ))
            .map((): EmailResponseSchema => ({
                header: 'Please check your email for a verification link',
                text: 'If you do not receive an email within a few minutes, please check your spam folder',
            }));
    }

    sendPasswordResetEmail (user: Omit<User, 'password'>, ip: string, device: string, endpoint: string) {
        return TaskEither
            .of(user)
            .filter(
                (user: Omit<User, 'password'>) => user.confirmedEmail,
                () => createInternalError(
                    `Unable to send password reset email for user ${user.id}: user has not verified their email`,
                ),
            )
            .chain((user) => this.sendEmail(
                user.email,
                'Reset your password',
                ResetEmail({
                    token: user.confirmToken!,
                    username: user.username,
                    deviceName: device,
                    inviteFromIp: ip,
                    endpoint,
                }),
            ))
            .map(() => ({
                header: 'Please check your email for a password reset link',
                text: 'If you do not receive an email within a few minutes, please check your spam folder',
            }));
    }

    sendSocketNotification (notification: SocketNotification) {
        return this.retrieveChannelAndSocketId(notification.browserId)
            .map(({ channel, socketIds }) => channel.broadcastTo(socketIds, 'notification', { notification }))
            .toResult();
    }

    sendSocketAction (recipient: string, action: SocketActionNotification) {
        return this.retrieveChannelAndSocketId(recipient)
            .map(({ channel, socketIds }) => channel.broadcastTo(socketIds, 'action', { action }))
            .toResult();
    }

    sendNotification (notification: NotificationData) {
        const broadcast = false;

        const sendSocketOrFail = (session: Session) => this.retrieveChannelAndSocketId(session.browserId)
            .map(({ channel, socketIds }) => channel.broadcastTo(socketIds, 'notification', {
                notification: {
                    title: notification.title,
                    content: notification.message,
                    image: notification.image,
                    browserId: session.browserId,
                    error: false,
                },
            }))
            .toTaskEither();

        return TaskEither
            .tryCatch(
                () => this.prisma.session.findMany({
                    where: {
                        userId: notification.receiverId,
                    },
                }),
                'Failed to find sessions for user',
            )
            .chainItems(sendSocketOrFail)
            .map(() => broadcast)
            .matchTask([
                {
                    predicate: (broadcast) => !broadcast,
                    run: (broadcast) => TaskEither
                        .tryCatch(
                            () => this.prisma.notification.create({
                                data: notification,
                            }),
                            'Failed to save notification',
                        )
                        .map(() => broadcast),
                },
                {
                    predicate: (broadcast) => !broadcast,
                    run: (broadcast) => TaskEither.of(broadcast),
                },
            ]);
    }

    adminsNotification (notification: Omit<NotificationData, 'receiverId'>) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findMany({
                    where: {
                        role: Role.ADMIN,
                    },
                }),
                'Failed to find admins',
            )
            .ioSync(() => this.logChannel.sendNotification({
                title: notification.title,
                content: notification.message,
                image: notification.image || '',
                browserId: 'admin',
                error: false,
            }))
            .chainItems((admin) => this.adminNotification(admin, notification, false));
    }

    adminNotification (user: User, notification: Omit<NotificationData, 'receiverId'>, notify = true) {
        const performNotification = (session: Session) => this.retrieveChannelAndSocketId(session.browserId)
            .map(({ channel, socketIds }) => channel.broadcastTo(socketIds, 'notification', {
                notification: {
                    title: notification.title,
                    content: notification.message,
                    image: notification.image || '',
                    browserId: session.browserId,
                    error: false,
                },
            }))
            .toTaskEither();

        const getSessions = TaskEither
            .tryCatch(
                () => this.prisma.session.findMany({
                    where: {
                        userId: user.id,
                    },
                }),
                'Failed to find sessions for user',
            );

        return TaskEither
            .of({ notify })
            .matchTask([
                {
                    predicate: ({ notify }) => notify,
                    run: () => getSessions,
                },
                {
                    predicate: ({ notify }) => !notify,
                    run: () => TaskEither.of([]),
                },
            ])
            .chainItems(performNotification);
    }

    private retrieveChannelAndSocketId (browserId: string, checkIncognito = true) {
        return Either
            .fromNullable(this.notificationChannel.channel.getChannel(NOTIFICATION_CHANNEL))
            .chain((channel) => {
                const users = channel.getAssigns();
                const socketIds = Object.entries(users)
                    .filter(([_, user]) => user.browserId === browserId && (!checkIncognito || !user.incognito))
                    .map(([key]) => key);

                return Either.fromNullable(socketIds.length === 0
                    ? null
                    : { channel,
                        socketIds });
            });
    }

    private sendEmail (email: string, subject: string, react: React.JSX.Element) {
        return TaskEither
            .tryCatch(
                () => render(react),
            )
            .chain((html) => this.mailService.sendMail({
                to: email,
                subject,
                html,
            }))
            .map(() => true)
            .orElse(() => TaskEither.of(false));
    }
}
