import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, MediaType } from '@prisma/client';

import { SlimMedia, SlimMediaSchema } from '../media/media.contracts';
import { RatedStatus } from '../rating/rating.contracts';
import { SeenResponse, SeenResponseSchema } from '../seen/seen.contracts';
import { createHomeResponse, createPageResponse } from '../utils/utils.contracts';

class SlimFrontUserSchema {
    @ApiProperty({
        description: 'The user ID',
        type: String,
    })
    userId: string;

    @ApiProperty({
        description: 'The username of the user',
        type: String,
    })
    username: string;

    @ApiProperty({
        description: 'The number of media the user has watched',
        type: Number,
    })
    watched: number;

    @ApiProperty({
        description: 'The number of media the user has rated',
        type: Number,
    })
    rated: number;

    @ApiProperty({
        description: 'The number of lists the user has created',
        type: Number,
    })
    lists: number;

    @ApiProperty({
        description: 'The date the user was created',
        type: String,
    })
    created: string;

    @ApiProperty({
        description: 'The email of the user',
        type: String,
    })
    email: string;

    @ApiProperty({
        description: 'The role of the user',
        'enum': Role,
        enumName: 'Role',
    })
    role: Role;

    @ApiProperty({
        description: 'The number of media the user has seen',
        type: Number,
    })
    seen: number;

    @ApiProperty({
        description: 'The number of user groups the user is in',
        type: Number,
    })
    userGroups: number;

    @ApiProperty({
        description: 'The number of playlists the user has created',
        type: Number,
    })
    playlists: number;

    @ApiProperty({
        description: 'Whether the user has been revoked',
        type: Boolean,
    })
    revoked: boolean;

    @ApiProperty({
        description: 'Whether the user has confirmed their email',
        type: Boolean,
    })
    confirmed: boolean;
}

export enum HistoryType {
    WATCHED = 'Watched',
    ADDED_TO_WATCHLIST = 'Added_to_watchlist',
    RATED_POSITIVE = 'Rated_positive',
    RATED_NEGATIVE = 'Rated_negative',
}

export interface UserMediaDetails {
    isInList: boolean;
    rating: RatedStatus;
    seen: SeenResponse;
    canModify: boolean;
}

export interface ContinueWatchingItem extends SlimMedia {
    videoId: string;
    percentage: number;
}

export interface SlimFrontUser {
    userId: string;
    username: string;
    watched: number;
    rated: number;
    lists: number;
    created: string;
    email: string;
    role: Role;
    seen: number;
    userGroups: number;
    playlists: number;
    revoked: boolean;
    confirmed: boolean;
}

export class UserMediaDetailsResponseSchema {
    @ApiProperty({
        description: 'Whether the media is in the user\'s list',
        type: Boolean,
    })
    isInList: boolean;

    @ApiProperty({
        description: 'The user\'s rating of the media',
        'enum': RatedStatus,
        enumName: 'RatedStatus',
    })
    rating: RatedStatus;

    @ApiProperty({
        description: 'The user\'s seen status of the media',
        type: SeenResponseSchema,
    })
    seen: SeenResponse;

    @ApiProperty({
        description: 'Whether the user can modify the media',
        type: Boolean,
    })
    canModify: boolean;
}

export class ContinueWatchingItemSchema extends SlimMediaSchema {
    @ApiProperty({
        description: 'The video ID',
        type: String,
    })
    videoId: string;

    @ApiProperty({
        description: 'The percentage watched',
        type: Number,
    })
    percentage: number;
}

export class HomeResponseContinueWatchingSchema extends createHomeResponse(ContinueWatchingItemSchema) {}

export class PageResponseSlimFrontUserSchema extends createHomeResponse(SlimFrontUserSchema) {}

export class ProfileDetailsSchema {
    @ApiProperty({
        description: 'The email of the user',
        type: String,
    })
    email: string;

    @ApiProperty({
        description: 'The username of the user',
        type: String,
    })
    username: string;

    @ApiProperty({
        description: 'Whether the user wants to autoplay videos',
        type: Boolean,
    })
    autoplay: boolean;

    @ApiProperty({
        description: 'Whether the user is incognito',
        type: Boolean,
    })
    incognito: boolean;

    @ApiProperty({
        description: 'Whether the user wants to inform the server of their progress',
        type: Boolean,
    })
    inform: boolean;

    @ApiProperty({
        description: 'The language of the user',
        type: String,
    })
    language: string;

    @ApiProperty({
        description: 'The available languages for the user',
        type: [String],
    })
    availableLanguages: string[];
}

class HistoryMediaItemSchema {
    @ApiProperty({
        description: 'The id of the media',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the media',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The poster of the media',
        type: String,
    })
    poster: string;

    @ApiProperty({
        description: 'The blurred poster of the media',
        type: String,
    })
    posterBlur: string;

    @ApiPropertyOptional({
        description: 'The episode of the media, if applicable',
        type: Number,
    })
    episode?: number;

    @ApiPropertyOptional({
        description: 'The season of the media, if applicable',
        type: Number,
    })
    season?: number;

    @ApiPropertyOptional({
        description: 'The video id of the media, if applicable',
        type: String,
    })
    videoId?: string;

    @ApiProperty({
        description: 'The type of the media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    type: MediaType;
}

export class HistorySchema {
    @ApiProperty({
        description: 'The media in the history',
        type: HistoryMediaItemSchema,
    })
    media: HistoryMediaItemSchema;

    @ApiProperty({
        description: 'The type of history',
        'enum': HistoryType,
        enumName: 'HistoryType',
    })
    type: HistoryType;

    @ApiProperty({
        description: 'The date of the history',
        type: String,
    })
    date: string;

    @ApiProperty({
        description: 'The ID of the history',
        type: String,
    })
    id: string;
}

export class PageResponseHistorySchema extends createPageResponse(HistorySchema) {}
