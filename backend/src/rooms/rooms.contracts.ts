import { Channel, UserData } from '@eleven-am/pondsocket/types';
import { PondResponse } from '@eleven-am/pondsocket-nest';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType, Room, View, Video, Media } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsUUID, IsNumber, IsBoolean, IsObject, ValidateNested } from 'class-validator';

import { UpNextDetailsSchema, UpNextDetails } from '../playback/playback.schema';
import { Assigns, PresenceInterface, MetaData } from '../socket/socket.schema';


export class InviteUserArgs {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    browserId: string;
}

export class JoinRoomArgs {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    playbackId: string;
}

export class PlayStateArgs {
    @IsNumber()
    time: number;

    @IsBoolean()
    isPaused: boolean;

    @IsString()
    username: string;

    @IsString()
    browserId: string;
}

export class BufferStateArgs {
    @IsNumber()
    time: number;

    @IsBoolean()
    buffering: boolean;

    @IsString()
    username: string;

    @IsString()
    browserId: string;
}

export class SeekedArgs {
    @IsNumber()
    time: number;
}

export class NextArgs {
    @IsObject()
    @ValidateNested()
    @Type(() => UpNextDetailsSchema)
    data: UpNextDetailsSchema;
}

export class MessageArgs {
    @IsString()
    text: string;

    @IsString()
    username: string;

    @IsString()
    browserId: string;
}

export interface RoomResponse {
    poster: string;
    backdrop: string;
    backdropBlur: string;
    logo: string | null;
    logoBlur: string | null;
    mediaType: MediaType;
    mediaName: string;
    mediaId: string;
    episodeId: string | null;
    episodeName: string | null;
    videoId: string;
    roomId: string;
    isLeader: boolean;
    playbackId: string;
}

export interface RoomAssigns extends Assigns {
    roomId: string;
    isLeader: boolean;
    joinTime: number;
    playbackId: string;
}

export type RoomEventMap = {
    noResponse: {};
    invite: { browserId: string };
    evict: { browserId: string };
    evicted: {};
    playState: {
        time: number;
        isPaused: boolean;
        username: string;
        browserId: string;
    };
    bufferState: {
        time: number;
        buffering: boolean;
        username: string;
        browserId: string;
    };
    seeked: {
        time: number;
    };
    next: {
        data: UpNextDetails;
    };
    message: {
        text: string;
    };
    requestSync: {};
    sync: {
        time: number;
    };
    promote: {
        browserId: string;
    };
    startSession: {
        time: number;
    };
}

export type RoomData = Room & {
    view: View & {
        video: Video & {
            media: Media;
        };
    };
}

export class RoomResponseSchema {
    @ApiProperty({
        type: String,
        description: 'The poster image URL',
    })
    poster: string;

    @ApiProperty({
        type: String,
        description: 'The backdrop image URL',
    })
    backdrop: string;

    @ApiProperty({
        type: String,
        description: 'The blurred backdrop image URL',
    })
    backdropBlur: string;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'The logo image URL',
    })
    logo: string | null;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'The blurred logo image URL',
    })
    logoBlur: string | null;

    @ApiProperty({
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
        description: 'The type of media',
    })
    mediaType: MediaType;

    @ApiProperty({
        type: String,
        description: 'The media name',
    })
    mediaName: string;

    @ApiProperty({
        type: String,
        description: 'The media ID',
    })
    mediaId: string;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'The episode ID',
    })
    episodeId: string | null;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'The episode name',
    })
    episodeName: string | null;

    @ApiProperty({
        type: String,
        description: 'The video ID',
    })
    videoId: string;

    @ApiProperty({
        type: String,
        description: 'The room ID',
    })
    roomId: string;

    @ApiProperty({
        type: Boolean,
        description: 'Whether the user is the room leader',
    })
    isLeader: boolean;

    @ApiProperty({
        type: String,
        description: 'The playback ID',
    })
    playbackId: string;
}

export type RoomReturnType<Event extends keyof RoomEventMap> =
  PondResponse<RoomEventMap, Event, PresenceInterface<MetaData>, RoomAssigns>;

export type RoomChannel = Channel<RoomEventMap, PresenceInterface<MetaData>, RoomAssigns>
export type RoomUserData = UserData<PresenceInterface<MetaData>, RoomAssigns>

