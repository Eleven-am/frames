import { AppAbilityType } from '@eleven-am/authorizer';
import { TaskEither, sortBy } from '@eleven-am/fp';
import { Injectable, BadRequestException } from '@nestjs/common';
import { Media, Room } from '@prisma/client';

import { InviteUserArgs, RoomChannel, RoomData, RoomResponse, RoomUserData } from './rooms.contracts';
import { MediaService } from '../media/media.service';
import { SocketAction, SocketActionNotification } from '../notifications/notification.schema';
import { NotificationService } from '../notifications/notification.service';
import { Playback, PlaybackSession } from '../playback/playback.schema';
import { PlaybackService } from '../playback/playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';


@Injectable()
export class RoomsService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly mediaService: MediaService,
        private readonly playbackService: PlaybackService,
        private readonly notificationService: NotificationService,
    ) {}

    createRoomFromPlayback (session: CachedSession, playback: Playback) {
        return this.playbackService.playFromPlaybackSession(session, playback)
            .chain((playbackSession) => TaskEither
                .tryCatch(
                    () => this.prisma.room.create({
                        data: {
                            viewId: playbackSession.playbackId,
                        },
                    }),
                    'Failed to create room',
                )
                .map((room) => this.mapToRoomResponse(room, playbackSession)));
    }

    createRoomFromMedia (session: CachedSession, media: Media, ability: AppAbilityType) {
        return this.mediaService.playMedia(session, media, ability)
            .chain((playbackSession) => TaskEither
                .tryCatch(
                    () => this.prisma.room.create({
                        data: {
                            viewId: playbackSession.playbackId,
                        },
                    }),
                    'Failed to create room',
                )
                .map((room) => this.mapToRoomResponse(room, playbackSession)));
    }

    joinRoom (session: CachedSession, room: RoomData) {
        return this.playbackService.playFromVideo(session, room.view.video);
    }

    updateRoom (room: RoomData, playback: Playback) {
        return TaskEither
            .tryCatch(
                () => this.prisma.room.update({
                    where: {
                        id: room.id,
                    },
                    data: {
                        viewId: playback.id,
                    },
                }),
                'Failed to update room',
            )
            .map(() => ({
                message: 'Room updated successfully',
            }));
    }

    inviteUser (session: CachedSession, room: RoomData, args: InviteUserArgs) {
        const acceptAction: SocketAction = {
            label: 'Join session',
            url: `/rooms/${room.id}`,
            mask: `/r=${room.id}`,
        };

        const declineAction: SocketAction = {
            label: 'Decline',
            event: {
                error: true,
                browserId: session.browserId,
                title: 'Declined watch session',
                image: room.view.video.media.poster,
                content: `has declined your invitation to watch ${room.view.video.media.name} with them.`,
            },
        };

        const action: SocketActionNotification = {
            error: false,
            accept: acceptAction,
            decline: declineAction,
            browserId: session.browserId,
            title: 'You have been invited to a watch session',
            content: `${session.user.username} has invited you to watch ${room.view.video.media.name} with them in a watch session.`,
        };

        this.notificationService.sendSocketAction(args.browserId, action);

        return { message: 'The user has been invited' };
    }

    evictUser (args: InviteUserArgs, channel: RoomChannel) {
        const users = channel.getAssigns();
        const user = Object.entries(users)
            .map(([socketId, user]) => ({
                socketId,
                ...user,
            }))
            .find((user) => user.browserId === args.browserId);

        if (!user) {
            throw new BadRequestException('User not found');
        }

        channel.broadcastTo(user.socketId, 'evicted', {});
        channel.evictUser(user.socketId);
    }

    leaveRoom (userData: RoomUserData, channel: RoomChannel) {
        const users = Object.entries(channel.getAssigns())
            .map(([socketId, user]) => ({
                socketId,
                ...user,
            }));

        const [newLeader] = sortBy(users, 'joinTime', 'asc');

        return TaskEither
            .fromNullable(newLeader)
            .chain(({ socketId, browserId, playbackId }) => TaskEither
                .tryCatch(
                    () => this.prisma.room.update({
                        where: {
                            id: userData.assigns.roomId,
                        },
                        data: {
                            viewId: playbackId,
                        },
                    }),
                    'Failed to update room',
                )
                .map(() => ({
                    socketId,
                    browserId,
                })))
            .ioSync(({ socketId, browserId }) => {
                channel
                    .updateAssigns(socketId, {
                        isLeader: true,
                    })
                    .broadcastTo(socketId, 'promote', {
                        browserId,
                    });
            })
            .toResult();
    }

    private mapToRoomResponse (room: Room, playbackSession: PlaybackSession): RoomResponse {
        return {
            roomId: room.id,
            isLeader: false,
            mediaName: playbackSession.name,
            episodeName: playbackSession.episodeName,
            playbackId: playbackSession.playbackId,
            backdrop: playbackSession.backdrop,
            backdropBlur: playbackSession.backdropBlur,
            episodeId: playbackSession.episodeId,
            logo: playbackSession.logo,
            logoBlur: playbackSession.logoBlur,
            mediaId: playbackSession.mediaId,
            mediaType: playbackSession.mediaType,
            poster: playbackSession.poster,
            videoId: playbackSession.videoId,
        };
    }
}
