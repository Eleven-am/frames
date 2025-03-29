import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength, Matches } from 'class-validator';

import { SlimMedia, SlimMediaSchema } from '../media/media.contracts';
import { createPageResponse } from '../utils/utils.contracts';

export class CreateFrameArgs {
    @IsNumber()
    @ApiProperty({
        description: 'The percentage of the video that has been watched',
        format: 'number',
    })
    percentage: number;

    @IsString()
    @MinLength(13)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])/, {
        message: 'cypher must contain both uppercase and lowercase letters'
    })
    @ApiProperty({
        description: 'The cypher of the video',
        minLength: 13,
        example: 'ExampleCypher123'
    })
    cypher: string;
}

export interface FrameResponse extends SlimMedia {
    percentage: number;
}

export class FramesItemSchema extends SlimMediaSchema {
    @ApiProperty({
        description: 'The percentage of the video the frame was created at',
        minimum: 0,
        maximum: 100,
    })
    percentage: number;
}


export class FrameCreateSchema {
    @ApiProperty({
        description: 'The cypher of the created frame',
    })
    cypher: string;

    @ApiProperty({
        description: 'The created date of the frame',
        format: 'date-time',
    })
    created: string;

    @ApiProperty({
        description: 'The percentage of the video the frame was created at',
        minimum: 0,
        maximum: 100,
    })
    percentage: number;
}

export class PageResponseFrameSchema extends createPageResponse(FramesItemSchema) {}
