import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

export class DownloadsSchema {
    @ApiProperty({
        description: 'The download URL',
    })
    location: string;
}

export class DownloadItemSchema {
    @ApiProperty({
        description: 'The id of the media item',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the media item',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The download URL',
    })
    location: string;

    @ApiProperty({
        description: 'The episode name',
        nullable: true,
        type: String,
    })
    episodeName: string | null;

    @ApiProperty({
        description: 'The episode number',
    })
    backdrop: string;

    @ApiProperty({
        description: 'The blurred backdrop of the media item',
        type: String,
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The backdrop image',
    })
    createdAt: string;

    @ApiProperty({
        description: 'The type of media item',
        type: String,
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
    })
    type: MediaType;

    @ApiProperty({
        description: 'If the download can still be accessed',
    })
    isAccessible: boolean;
}
