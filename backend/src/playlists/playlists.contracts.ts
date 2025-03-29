import { ApiProperty } from '@nestjs/swagger';
import { AccessPolicy } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsBoolean, IsArray, ValidateNested, IsEmail } from 'class-validator';

import { createPageResponse } from '../utils/utils.contracts';

export interface VideoItem {
    id: string;
    index: number;
    videoId: string;
}

export interface PlaylistResponse {
    id: string;
    name: string;
    overview: string;
    isPublic: boolean;
    backdrop: string;
    backdropBlur: string;
    videoCount: number;
    updatedAt: string;
}

export interface PlaylistVideoResponse {
    id: string;
    playlistId: string;
    videoId: string;
    backdrop: string;
    index: number;
    backdropBlur: string;
    updatedAt: string;
    name: string;
}

export interface PlaylistDetails {
    id: string;
    name: string;
    overview: string;
    accessPolicy: AccessPolicy;
    author: string;
    isPublic: boolean;
    videos: PlaylistVideoResponse[];
    updatedAt: string;
}

export interface PlaylistForMediaContext {
    playlistId: string;
    playlistName: string;
    isPublic: boolean;
    mediaInPlaylist: boolean;
}

export class SingleVideo {
    @IsString()
    @ApiProperty({
        description: 'The id of the video',
    })
    videoId: string;

    @ApiProperty({
        description: 'The index of the video in the playlist',
    })
    @IsNumber({
        allowInfinity: false,
        allowNaN: false,
        maxDecimalPlaces: 0,
    })
    index: number;
}

export class SingleVideoWithId extends SingleVideo {
    @IsString()
    @ApiProperty({
        description: 'The id of the playlist video',
    })
    id: string;
}

export class CreatePlaylistArgs {
    @IsString()
    @ApiProperty({
        description: 'The name of the playlist',
    })
    name: string;

    @IsString()
    @ApiProperty({
        description: 'The overview of the playlist',
    })
    overview: string;

    @ApiProperty({
        description: 'Whether the playlist is public',
    })
    @IsBoolean()
    isPublic: boolean;

    @ApiProperty({
        description: 'The videos in the playlist',
        type: [SingleVideo],
    })
    @Type(() => SingleVideo)
    @IsArray({ always: true })
    @ValidateNested({
        always: true,
        each: true,
    })
    videos: SingleVideo[];
}

export class UpdatePlaylistArgs extends CreatePlaylistArgs {
    @IsString()
    @ApiProperty({
        description: 'The id of the playlist video',
    })
    id: string;

    @ApiProperty({
        description: 'The videos in the playlist',
        type: [SingleVideoWithId],
    })
    @Type(() => SingleVideoWithId)
    @IsArray({ always: true })
    @ValidateNested({
        always: true,
        each: true,
    })
    videos: SingleVideoWithId[];
}

class SharedUser {
    @IsEmail()
    @ApiProperty({
        description: 'The email of the user',
        type: 'string',
        format: 'email',
    })
    email: string;

    @IsString()
    @ApiProperty({
        description: 'The access policy assigned to the user for the playlist',
        'enum': AccessPolicy,
    })
    policy: AccessPolicy;
}

export class SharePlaylistArgs {
    @IsString()
    @ApiProperty({
        description: 'The id of the playlist to share',
    })
    playlistId: string;

    @ValidateNested({ each: true })
    @ApiProperty({
        description: 'The users to share the playlist with',
        type: [SharedUser],
    })
    users: SharedUser[];
}

class PlaylistItemSchema {
    @ApiProperty({
        description: 'The id of the playlist',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the playlist',
    })
    name: string;

    @ApiProperty({
        description: 'The overview of the playlist',
    })
    overview: string;

    @ApiProperty({
        description: 'Whether the playlist is public',
    })
    isPublic: boolean;

    @ApiProperty({
        description: 'The backdrop of the playlist',
        format: 'uri',
    })
    backdrop: string;

    @ApiProperty({
        description: 'The backdrop blur of the playlist',
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The number of videos in the playlist',
    })
    videoCount: number;

    @ApiProperty({
        description: 'The last updated date of the playlist',
        format: 'date-time',
    })
    updatedAt: string;
}

export class PageResponsePlaylistSchema extends createPageResponse(PlaylistItemSchema) {}

class PlaylistVideoResponseSchema {
    @ApiProperty({
        description: 'The id of the playlist video',
    })
    id: string;

    @ApiProperty({
        description: 'The id of the playlist',
    })
    playlistId: string;

    @ApiProperty({
        description: 'The id of the video',
    })
    videoId: string;

    @ApiProperty({
        description: 'The backdrop of the playlist video',
        format: 'uri',
    })
    backdrop: string;

    @ApiProperty({
        description: 'The index of the video in the playlist',
    })
    index: number;

    @ApiProperty({
        description: 'The backdrop blur of the playlist video',
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The last updated date of the playlist video',
        format: 'date-time',
    })
    updatedAt: string;

    @ApiProperty({
        description: 'The name of the video',
    })
    name: string;
}

export class PlaylistDetailsSchema {
    @ApiProperty({
        description: 'The id of the playlist',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the playlist',
    })
    name: string;

    @ApiProperty({
        description: 'The overview of the playlist',
    })
    overview: string;

    @ApiProperty({
        description: 'The policy of the user for the playlist',
        'enum': AccessPolicy,
    })
    accessPolicy: AccessPolicy;

    @ApiProperty({
        description: 'The author of the playlist',
    })
    author: string;

    @ApiProperty({
        description: 'Whether the playlist is public',
    })
    isPublic: boolean;

    @ApiProperty({
        description: 'The videos in the playlist',
        type: [PlaylistVideoResponseSchema],
    })
    videos: PlaylistVideoResponse[];

    @ApiProperty({
        description: 'The last updated date of the playlist',
        format: 'date-time',
    })
    updatedAt: string;
}

export class PlaylistForMediaContextSchema {
    @ApiProperty({
        description: 'The id of the playlist',
    })
    playlistId: string;

    @ApiProperty({
        description: 'The name of the playlist',
    })
    playlistName: string;

    @ApiProperty({
        description: 'Whether the playlist is public',
    })
    isPublic: boolean;

    @ApiProperty({
        description: 'Whether the media is in the playlist',
    })
    mediaInPlaylist: boolean;
}
