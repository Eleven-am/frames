import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsOptional, IsBoolean, IsArray, IsString, IsEnum } from 'class-validator';

import { HistoryType } from './user.schema';
import { PaginateArgs } from '../utils/utils.contracts';


export class UpdateUserArgs {
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Whether the user is incognito',
        type: Boolean,
    })
    incognito?: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Whether the user wants to inform the server of their progress',
        type: Boolean,
    })
    inform?: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Whether the user wants to auto play videos',
        type: Boolean,
    })
    autoplay?: boolean;
}

export class BulkUsersArgs {
    @IsArray()
    @IsString({ each: true })
    @ApiPropertyOptional({
        description: 'The user IDs to perform the bulk action on',
        type: [String],
    })
    userIds: string[];
}

export class BulkItemsArgs {
    @IsArray()
    @IsString({ each: true })
    @ApiPropertyOptional({
        description: 'The item IDs to perform the bulk action on',
        type: [String],
    })
    itemIds: string[];
}

export class PromoteUsersArgs extends BulkUsersArgs {
    @IsString()
    @IsEnum(Role)
    @ApiPropertyOptional({
        description: 'The role to promote the users to',
        'enum': Role,
        enumName: 'Role',
    })
    role: Role;
}

export class GetActivityArgs extends PaginateArgs {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description: 'The query to search for',
        type: String,
    })
    query?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(HistoryType, { each: true })
    @ApiPropertyOptional({
        description: 'The type of history to search for',
        'enum': HistoryType,
        enumName: 'HistoryType',
        isArray: true,
        example: [HistoryType.WATCHED, HistoryType.ADDED_TO_WATCHLIST],
    })
    type?: HistoryType[];
}
