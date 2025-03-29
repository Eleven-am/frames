import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { FfprobeData } from 'fluent-ffmpeg';

import { FramesFile } from '../storage/storage.schema';

export interface ThumbnailTimestamp {
    timeInSec: number;
    percentage: number;
}

export interface QualityOption {
    name: string;
    width: number;
    height: number;
    videoBitrate: number;
    audioBitrate: number;
}

export interface Segments {
    start: number;
    end: number;
    index: number;
    duration: string;
}

export type StreamItem = {
    videoId: string;
    file: FramesFile;
    metadata: FfprobeData;
    segments: Segments[];
    userId: string;
}

export class StreamParams {
    @IsEnum(['1080p', '720p', '480p'])
    quality: string;

    @IsString()
    @IsNotEmpty()
    segment: string;
}

export class ArtworkSchema {
    @ApiProperty({
        description: 'The base64 encoded image data',
        type: String,
    })
    url: string;

    @ApiProperty({
        description: 'The id of the video the artwork is for',
        type: String,
    })
    videoId: string;

    @ApiProperty({
        description: 'The percentage of the video the artwork is for',
        type: Number,
    })
    percentage: number;
}
