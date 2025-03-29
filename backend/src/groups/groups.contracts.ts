import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGroupArgs {
    @ApiProperty({
        description: 'The name of the group',
        type: 'string',
    })
    @IsString()
    name: string;
}


export interface GroupDetails {
    id: string;
    name: string;
    description: string;
    adminUsers: string[];
    basicUsers: string[];
    accessibleMediaCount: number;
    notAccessibleMediaCount: number;
    totalMediaCount: number;
}

export class GroupDetailsSchema implements GroupDetails {
    @ApiProperty({
        description: 'The id of the group',
        type: 'string',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the group',
        type: 'string',
    })
    name: string;

    @ApiProperty({
        description: 'The description of the group',
        type: 'string',
    })
    description: string;

    @ApiProperty({
        description: 'The admin users of the group',
        type: 'array',
        items: {
            type: 'string',
            format: 'email',
        },
    })
    adminUsers: string[];

    @ApiProperty({
        description: 'The basic users of the group',
        type: 'array',
        items: {
            type: 'string',
            format: 'email',
        },
    })
    basicUsers: string[];

    @ApiProperty({
        description: 'The count of accessible media',
        type: 'number',
    })
    accessibleMediaCount: number;

    @ApiProperty({
        description: 'The count of not accessible media',
        type: 'number',
    })
    notAccessibleMediaCount: number;

    @ApiProperty({
        description: 'The count of total media',
        type: 'number',
    })
    totalMediaCount: number;
}
