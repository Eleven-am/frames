import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export interface NodeCueData {
    start: number;
    end: number;
    text: string;
}

export interface SubtitleInfo {
    id: string;
    offset: number;
    label: string;
    srcLang: string;
    nodes: NodeCueData[];
    subtitleUrl: string;
}

class NodeCueSchema {
    @ApiProperty({
        description: 'The start of the cue',
    })
    start: number;

    @ApiProperty({
        description: 'The end of the cue',
    })
    end: number;

    @ApiProperty({
        description: 'The text of the cue',
    })
    text: string;
}

export class UpdateOffsetSchema {
    @ApiProperty({
        description: 'The new offset to set for the subtitle',
    })
    @IsNumber()
    offset: number;
}

export class SubtitleInfoSchema {
    @ApiProperty({
        description: 'The id of the subtitle',
    })
    id: string;

    @ApiProperty({
        description: 'The offset of the subtitle',
    })
    offset: number;

    @ApiProperty({
        description: 'The cues of the subtitle',
        type: [NodeCueSchema],
    })
    nodes: NodeCueData[];

    @ApiProperty({
        description: 'The URL of the subtitle',
    })
    subtitleUrl: string;

    @ApiProperty({
        description: 'The label of the subtitle',
    })
    label: string;

    @ApiProperty({
        description: 'The source language of the subtitle',
    })
    srcLang: string;
}
