import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Min, IsNumber, Allow } from 'class-validator';

type ClassType<T> = new (...args: any[]) => T;

export enum HomeResponseTypes {
    BASIC = 'BASIC',
    EDITOR = 'EDITOR',
    CLASSIC = 'CLASSIC',
    CONTINUE_WATCHING = 'CONTINUE_WATCHING',
}

export interface PageResponse<DataType> {
    page: number;
    totalPages: number;
    totalResults: number;
    results: DataType[];
}

class PaginationSchema<T> {
    @ApiProperty({
        description: 'The current page of the results',
        type: Number,
    })
    page: number;

    @ApiProperty({
        description: 'The total number of pages of results',
        type: Number,
    })
    totalPages: number;

    @ApiProperty({
        description: 'The total number of results',
        type: Number,
    })
    totalResults: number;

    @Allow()
    results: T[];
}

class HomeResponseSchema<T> {
    @Allow()
    results: T[];

    @ApiProperty({
        description: 'The type of response, used for display',
        type: String,
        'enum': [
            HomeResponseTypes.BASIC,
            HomeResponseTypes.EDITOR,
            HomeResponseTypes.CLASSIC,
            HomeResponseTypes.CONTINUE_WATCHING,
        ],
        enumName: 'HomeResponseTypes',
    })
    type: HomeResponseTypes;

    @ApiProperty({
        description: 'The label to display for the response',
        type: String,
    })
    label: string;

    @ApiProperty({
        description: 'The identifier to use for the response, used for deduplication',
        type: String,
    })
    identifier: string;
}

export class FramesGenericResponseSchema {
    @ApiProperty({
        description: 'The message indicating the success or failure of the request',
    })
    message: string;
}

export function createPageResponse<T> (type: ClassType<T>): ClassType<PaginationSchema<T>> {
    class PaginatedResponse extends PaginationSchema<T> {
        @ApiProperty({
            description: 'The items to paginate',
            type: [type],
        })
        results: T[];
    }

    return PaginatedResponse;
}

export function createHomeResponse<T> (type: ClassType<T>): ClassType<HomeResponseSchema<T>> {
    class HomeResponse extends HomeResponseSchema<T> {
        @ApiProperty({
            description: 'The items to display',
            type: [type],
        })
        results: T[];
    }

    return HomeResponse;
}

export class PaginateArgs {
    @IsNumber({
        maxDecimalPlaces: 0,
        allowInfinity: false,
    })
    @ApiProperty({
        description: 'The page number',
        type: 'number',
    })
    @Min(1)
    @Type(() => Number)
    page: number;

    @IsNumber({
        maxDecimalPlaces: 0,
        allowInfinity: false,
    })
    @ApiProperty({
        description: 'The number of items per page',
        type: 'number',
    })
    @Min(10)
    @Type(() => Number)
    pageSize: number;
}
