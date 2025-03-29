import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class IsInListResponseSchema {
    @ApiProperty({
        description: 'Whether the media item is in the list',
    })
    isInList: boolean;
}

export class PlayMyListArgs {
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    @ApiProperty({
        description: 'Whether to play the list in shuffle mode',
        type: Boolean,
        required: false,
    })
    shuffle: boolean;
}
