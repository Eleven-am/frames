import { ApiProperty } from '@nestjs/swagger';
import {MediaType, Video, View, Episode, PlaylistVideo, CloudStorage} from '@prisma/client';
import { IsPositive, IsNumber } from 'class-validator';

import { TmdbVideoDetails, TmdbVideoDetailsSchema } from '../media/media.contracts';
import {CachedSession} from "../session/session.contracts";

export type Playback = View & { video: Video & { cloudStorage: CloudStorage } };

export type PlaybackVideo = Video & { episode: Episode | null };

export interface SubtitleData {
    language: string;
    subtitleId: string;
}

export interface PlaybackData extends Omit<TmdbVideoDetails, 'imdbId'> {
    poster: string;
    backdrop: string;
    backdropBlur: string;
    logo: string | null;
    logoBlur: string | null;
    availableSubtitles: SubtitleData[];
    mediaType: MediaType;
    mediaId: string;
    source: string;
    episodeId: string | null;
    videoId: string;
}

export interface PlaybackSession extends PlaybackData {
    playbackId: string;
    inform: boolean;
    autoPlay: boolean;
    percentage: number;
    canAccessStream: boolean;
}

export interface UpNextDetails {
    backdropBlur: string;
    backdrop: string;
    logo: string | null;
    logoBlur: string | null;
    name: string;
    overview: string;
    type: MediaType;
    episodeName: string | null;
    episodeBackdrop: string | null;
    episodeOverview: string | null;
    playlistVideoId: string | null;
    videoId: string;
    mediaId: string;
}

export interface GetPlaybackSessionParams {
    playlistVideo?: PlaylistVideo | null;
    cachedSession: CachedSession;
    video: PlaybackVideo;
    percentage: number;
    inform?: boolean;
    isFrame?: boolean;
}

class SubtitleSchema {
    @ApiProperty({
        description: 'The language of the subtitle',
    })
    language: string;

    @ApiProperty({
        description: 'The id of the subtitle',
    })
    subtitleId: string;
}

class PlaybackDataSchema extends TmdbVideoDetailsSchema {
    @ApiProperty({
        description: 'The poster of the media',
        format: 'uri',
    })
    poster: string;

    @ApiProperty({
        description: 'The backdrop of the media',
        format: 'uri',
    })
    backdrop: string;

    @ApiProperty({
        description: 'The blurred backdrop of the media',
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The logo of the media',
        format: 'uri',
        nullable: true,
    })
    logo: string;

    @ApiProperty({
        description: 'The blurred logo of the media',
        nullable: true,
    })
    logoBlur: string;

    @ApiProperty({
        description: 'The available subtitles for the media',
        type: [SubtitleSchema],
    })
    availableSubtitles: SubtitleSchema[];

    @ApiProperty({
        description: 'The active subtitle for the media',
    })
    activeSubtitle: string;

    @ApiProperty({
        description: 'The active subtitle url for the media',
    })
    activeSubtitleUrl: string;

    @ApiProperty({
        description: 'The type of the media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    mediaType: MediaType;

    @ApiProperty({
        description: 'The id of the media',
    })
    mediaId: string;

    @ApiProperty({
        description: 'The source of the media',
        format: 'uri',
    })
    source: string;

    @ApiProperty({
        description: 'The id of the episode',
    })
    episodeId: string;

    @ApiProperty({
        description: 'The id of the video',
    })
    videoId: string;
}

export class UpNextDetailsSchema {
    @ApiProperty({
        description: 'The blurred backdrop of the media',
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The backdrop of the media',
        format: 'uri',
    })
    backdrop: string;

    @ApiProperty({
        description: 'The logo of the media',
        format: 'uri',
        nullable: true,
    })
    logo: string;

    @ApiProperty({
        description: 'The blurred logo of the media',
        nullable: true,
    })
    logoBlur: string;

    @ApiProperty({
        description: 'The name of the media',
    })
    name: string;

    @ApiProperty({
        description: 'The overview of the media',
    })
    overview: string;

    @ApiProperty({
        description: 'The type of the media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    type: MediaType;

    @ApiProperty({
        description: 'The name of the episode',
        nullable: true,
    })
    episodeName: string;

    @ApiProperty({
        description: 'The backdrop of the episode',
        nullable: true,
    })
    episodeBackdrop: string;

    @ApiProperty({
        description: 'The overview of the episode',
        nullable: true,
    })
    episodeOverview: string;

    @ApiProperty({
        description: 'The id of the playlist video',
        nullable: true,
    })
    playlistVideoId: string;

    @ApiProperty({
        description: 'The id of the video',
    })
    videoId: string;

    @ApiProperty({
        description: 'The id of the media',
    })
    mediaId: string;
}

export class PlaybackSessionSchema extends PlaybackDataSchema {
    @ApiProperty({
        description: 'The id of the playback',
    })
    playbackId: string;

    @ApiProperty({
        description: 'Inform the user about the playback',
    })
    inform: boolean;

    @ApiProperty({
        description: 'Auto play the next video',
    })
    autoPlay: boolean;

    @ApiProperty({
        description: 'The percentage of the playback',
    })
    percentage: number;

    @ApiProperty({
        description: 'Whether the user is allowed to access the underlying stream',
    })
    canAccessStream: boolean;
}

export class UpdatePlaybackInformSchema {
    @ApiProperty({
        description: 'Whether to save the playback information',
        type: Boolean,
    })
    inform: boolean;
}

export class ProgressPlaybackParams {
    @ApiProperty({
        description: 'The percentage of the video that has been watched',
    })
    @IsNumber()
    @IsPositive()
    percentage: number;
}
