import { ApiProperty } from '@nestjs/swagger';
import { PickType, PickCategory, PickItem, Media } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { SlimMediaSchema } from '../media/media.contracts';
import { createPageResponse, PaginateArgs } from '../utils/utils.contracts';

class PickMediaArgs {
    @IsString()
    @ApiProperty({
        description: 'The id of the media',
        type: 'string',
    })
    id: string;

    @IsNumber()
    @ApiProperty({
        description: 'The index of the media',
        type: Number,
    })
    @Type(() => Number)
    index: number;
}

class PickMediaSchema {
    @ApiProperty({
        description: 'A single media item for a pick',
        type: SlimMediaSchema
    })
    media: SlimMediaSchema;

    @ApiProperty({
        description: 'The index of the media item',
        type: Number
    })
    index: number;
}

export class UpdatePicksArgs {
    @IsString()
    @ApiProperty({
        description: 'The title of the pick',
        type: 'string',
    })
    name: string;

    @IsBoolean()
    @IsOptional()
    isActive: boolean;

    @IsNumber()
    @ApiProperty({
        description: 'The index of the pick',
        type: Number,
    })
    @Type(() => Number)
    index: number;

    @IsIn([PickType.EDITOR, PickType.BASIC])
    @ApiProperty({
        description: 'The type of pick, changes the way it is displayed',
        'enum': [PickType.EDITOR, PickType.BASIC],
        enumName: 'PickType',
        type: 'string',
    })
    type: PickType;

    @IsArray()
    @Type(() => PickMediaArgs)
    @ValidateNested({
        always: true,
        each: true,
    })
    @ApiProperty({
        description: 'The media for the pick',
        type: [PickMediaArgs],
    })
    media: PickMediaArgs[];
}

export class CreatePicksArgs extends UpdatePicksArgs {}

export class GetPicksArgs {
    @IsNumber()
    @ApiProperty({
        description: 'The index of the pick',
        type: Number,
    })
    @Type(() => Number)
    index: number;

    @IsIn([PickType.EDITOR, PickType.BASIC])
    @ApiProperty({
        description: 'The type of pick, changes the way it is displayed',
        'enum': [PickType.EDITOR, PickType.BASIC],
        enumName: 'PickType',
        type: 'string',
    })
    type: PickType;
}

export class GetPaginatedPicksArgs extends PaginateArgs {
    @IsIn([PickType.EDITOR, PickType.BASIC])
    @ApiProperty({
        description: 'The type of pick, changes the way it is displayed',
        'enum': [PickType.EDITOR, PickType.BASIC],
        enumName: 'PickType',
        type: 'string',
    })
    type: PickType;
}

export class PickCountSchema {
    @ApiProperty({
        description: 'The number of basic picks',
        type: Number,
    })
    basic: number;

    @ApiProperty({
        description: 'The number of editor picks',
        type: Number,
    })
    editor: number;
}

export class PickResponseSchema {
    @ApiProperty({
        description: 'The category of the pick',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The title of the pick',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The media for the pick',
        type: [PickMediaSchema],
    })
    media: PickMediaSchema[];

    @ApiProperty({
        description: 'The type of pick, changes the way it is displayed',
        'enum': [PickType.EDITOR, PickType.BASIC],
        enumName: 'PickType',
        type: 'string',
    })
    type: PickType;

    @ApiProperty({
        description: 'The index of the pick',
        type: Number,
    })
    index: number;

    @ApiProperty({
        description: 'If the pick is active',
        type: Boolean,
    })
    isActive: boolean;
}

export class PageResponsePickSchema extends createPageResponse(PickResponseSchema) {}

export class DeletePicksArgs {
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ApiProperty({
        description: 'The ids of the picks to delete',
        type: 'array',
        items: {
            type: 'string',
        },
    })
    ids: string[];
}

export type Pick = PickCategory & {
    picks: (PickItem & { media: Media })[];
}
