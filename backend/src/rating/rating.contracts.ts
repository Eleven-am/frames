import { ApiProperty } from '@nestjs/swagger';

export enum RatedStatus {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
    NONE = 'NONE',
}

export class RatingResponseSchema {
    @ApiProperty({
        description: 'The id of the rating',
    })
    id: string;

    @ApiProperty({
        description: 'The id of the media',
        'enum': RatedStatus,
        enumName: 'RatedStatus',
    })
    status: RatedStatus;
}
