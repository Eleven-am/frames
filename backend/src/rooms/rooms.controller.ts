import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Media } from '@prisma/client';

import { RoomData, RoomResponseSchema } from './rooms.contracts';
import { CurrentRoom } from './rooms.decorators';
import { RoomsService } from './rooms.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { CurrentPlayback } from '../playback/playback.decorators';
import { Playback, PlaybackSessionSchema } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { ApiOkFramesResponse, ApiParamId } from '../utils/utils.decorators';


@Controller('rooms')
@ApiTags('Rooms')
export class RoomsController {
    constructor (
        private readonly roomService: RoomsService,
    ) {}

    @Post('media/:mediaId')
    @CanPerform(
        {
            action: Action.Read,
            resource: 'Media',
        },
        {
            action: Action.Create,
            resource: 'Room',
        },
    )
    @ApiCreatedResponse({
        description: 'Room created successfully',
        type: RoomResponseSchema,
    })
    @ApiMediaId('to create a room for')
    @ApiOperation({
        summary: 'Create a room for media',
        description: 'Create a room for the given media',
    })
    createRoomForMedia (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.roomService.createRoomFromMedia(session, media, ability);
    }

    @Post('playback/:playbackId')
    @CanPerform(
        {
            action: Action.Read,
            resource: 'View',
        },
        {
            action: Action.Create,
            resource: 'Room',
        },
    )
    @ApiCreatedResponse({
        description: 'Room created successfully',
        type: RoomResponseSchema,
    })
    @ApiParamId('playback', 'to create a room for')
    @ApiOperation({
        summary: 'Create a room for playback',
        description: 'Create a room for the given playback',
    })
    createRoomForPlayback (@CurrentSession.HTTP() session: CachedSession, @CurrentPlayback() playback: Playback) {
        return this.roomService.createRoomFromPlayback(session, playback);
    }

    @Patch(':roomId/:playbackId')
    @CanPerform({
        action: Action.Update,
        resource: 'Room',
    })
    @ApiParamId('room', 'to retrieve')
    @ApiOperation({
        summary: 'Updates a room session',
        description: 'Updates a room session with the given playback',
    })
    @ApiOkFramesResponse('The room has been updated')
    updateRoom (@CurrentRoom.HTTP() room: RoomData, @CurrentPlayback() playback: Playback) {
        return this.roomService.updateRoom(room, playback);
    }

    @Get(':roomId')
    @CanPerform({
        action: Action.Read,
        resource: 'Room',
    })
    @ApiParamId('room', 'to retrieve')
    @ApiOperation({
        summary: 'Join a room session',
        description: 'Joins a room session and creates a playback session',
    })
    @ApiCreatedResponse({
        description: 'The video playback has started',
        type: PlaybackSessionSchema,
    })
    joinRoom (@CurrentSession.HTTP() session: CachedSession, @CurrentRoom.HTTP() room: RoomData) {
        return this.roomService.joinRoom(session, room);
    }
}
