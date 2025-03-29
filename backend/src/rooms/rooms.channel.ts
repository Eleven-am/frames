import { CanPerform, Action } from '@eleven-am/authorizer';
import { Channel, OnJoinRequest, OnLeave, GetUserData, GetChannel } from '@eleven-am/pondsocket-nest';
import { Injectable, BadRequestException } from '@nestjs/common';

import { ROOM_CHANNEL_PREFIX } from './rooms.constants';
import {
    InviteUserArgs,
    PlayStateArgs,
    SeekedArgs,
    BufferStateArgs,
    NextArgs,
    MessageArgs,
    JoinRoomArgs,
    RoomReturnType,
    RoomData,
    RoomChannel,
    RoomUserData,
} from './rooms.contracts';
import { CurrentRoom, OnRoomEvent } from './rooms.decorators';
import { RoomsService } from './rooms.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';
import { GetValidPayload } from '../socket/socket.decorators';
import { PresenceAction } from '../socket/socket.schema';


@Injectable()
@Channel(`${ROOM_CHANNEL_PREFIX}/:roomId`)
export class RoomsChannel {
    constructor (
        private readonly roomService: RoomsService,
    ) {}

    @OnJoinRequest()
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onJoinRequest (@CurrentSession.WS() session: CachedSession, @CurrentRoom.WS() room: RoomData, @GetValidPayload() payload: JoinRoomArgs): RoomReturnType<'promote'> {
        return {
            event: room.view.userId === session.user.id ? 'promote' : undefined,
            browserId: session.browserId,
            assigns: {
                roomId: room.id,
                joinTime: Date.now(),
                isLeader: room.view.userId === session.user.id,
                playbackId: payload.playbackId,
            },
            presence: {
                isIncognito: session.user.incognito,
                username: session.user.username,
                channel: session.user.channel,
                browserId: session.browserId,
                onlineAt: Date.now(),
                status: 'online',
                metadata: {
                    logo: room.view.video.media.logo,
                    name: room.view.video.media.name,
                    poster: room.view.video.media.poster,
                    backdrop: room.view.video.media.backdrop,
                    backdropBlur: room.view.video.media.backdropBlur,
                    overview: `${room.view.video.media.name} - Session: ${room.id}`,
                    action: PresenceAction.WATCHING,
                },
            },
        };
    }

    @OnRoomEvent('invite')
    @CanPerform({
        action: Action.Manage,
        resource: 'Room',
    })
    onInvite (@CurrentSession.WS() session: CachedSession, @GetValidPayload() data: InviteUserArgs, @CurrentRoom.WS() room: RoomData) {
        return this.roomService.inviteUser(session, room, data);
    }

    @OnRoomEvent('evict')
    @CanPerform({
        action: Action.Manage,
        resource: 'Room',
    })
    onEvict (@GetChannel() channel: RoomChannel, @GetValidPayload() data: InviteUserArgs) {
        return this.roomService.evictUser(data, channel);
    }

    @OnRoomEvent('playState')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onPlayState (@GetValidPayload() data: PlayStateArgs): RoomReturnType<'playState'> {
        return {
            broadcastFrom: 'playState',
            time: data.time,
            isPaused: data.isPaused,
            username: data.username,
            browserId: data.browserId,
        };
    }

    @OnRoomEvent('bufferState')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onBufferState (@GetValidPayload() data: BufferStateArgs): RoomReturnType<'bufferState'> {
        return {
            broadcastFrom: 'bufferState',
            time: data.time,
            buffering: data.buffering,
            username: data.username,
            browserId: data.browserId,
        };
    }

    @OnRoomEvent('seeked')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onSeeked (@GetValidPayload() data: SeekedArgs): RoomReturnType<'seeked'> {
        return {
            broadcastFrom: 'seeked',
            time: data.time,
        };
    }

    @OnRoomEvent('next')
    @CanPerform({
        action: Action.Manage,
        resource: 'Room',
    })
    onNext (@GetValidPayload() data: NextArgs): RoomReturnType<'next'> {
        return {
            broadcastFrom: 'next',
            data: data.data,
        };
    }

    @OnRoomEvent('message')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onMessage (@GetValidPayload() data: MessageArgs): RoomReturnType<'message'> {
        return {
            broadcastFrom: 'message',
            text: data.text,
        };
    }

    @OnRoomEvent('requestSync')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onRequestSync (@GetChannel() channel: RoomChannel, @GetUserData() userData: RoomUserData) {
        if (userData.assigns.isLeader) {
            throw new BadRequestException('Cannot request sync as leader');
        }

        channel.broadcastFrom(userData.id, 'requestSync', {});
    }

    @OnRoomEvent('sync')
    @CanPerform({
        action: Action.Manage,
        resource: 'Room',
    })
    onSync (@GetValidPayload() data: SeekedArgs): RoomReturnType<'sync'> {
        return {
            broadcastFrom: 'sync',
            time: data.time,
        };
    }

    @OnRoomEvent('startSession')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    onStartSession (@GetValidPayload() data: SeekedArgs): RoomReturnType<'startSession'> {
        return {
            broadcast: 'startSession',
            time: data.time,
        };
    }

    @OnLeave()
    onLeave (@GetUserData() userData: RoomUserData, @GetChannel() channel: RoomChannel) {
        return this.roomService.leaveRoom(userData, channel);
    }
}
