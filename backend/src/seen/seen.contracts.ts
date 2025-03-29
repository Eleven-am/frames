import { ApiProperty } from '@nestjs/swagger';

export interface VideosSeen {
    videoId: string;
    percentage: number;
}

export interface SeenResponse {
    hasSeen: boolean;
    videosSeen: VideosSeen[];
}

class VideoSeen {
    @ApiProperty({
        description: 'The id of the video',
        type: String,
    })
    videoId: string;

    @ApiProperty({
        description: 'The percentage of the video that has been watched',
        type: Number,
    })
    percentage: number;
}

export class SeenResponseSchema {
    @ApiProperty({
        description: 'Whether the media item is marked as seen',
        type: Boolean,
    })
    hasSeen: boolean;

    @ApiProperty({
        description: 'The videos that have been seen',
        type: [VideoSeen],
    })
    videosSeen: VideoSeen[];
}

export class IsSeenResponseSchema {
    @ApiProperty({
        description: 'Whether the media item is marked as seen',
        type: Boolean,
    })
    isSeen: boolean;
}

