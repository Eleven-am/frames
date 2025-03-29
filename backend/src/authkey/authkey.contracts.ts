import { ApiProperty } from '@nestjs/swagger';
import { UseCase } from '@prisma/client';

import { createPageResponse } from '../utils/utils.contracts';

export interface AuthKeyResponse {
    case: UseCase;
    description: string;
    backdrop: string;
    key: string;
    name: string;
    revoked: boolean;
    date: Date;
}

class AuthKeyItemSchema {
    @ApiProperty({
        description: 'The use case of the auth key',
        'enum': UseCase,
    })
    case: UseCase;

    @ApiProperty({
        description: 'The description of the auth key usage',
    })
    description: string;

    @ApiProperty({
        description: 'The backdrop of the media the auth key was used for',
        format: 'uri',
        nullable: true,
    })
    backdrop: string;

    @ApiProperty({
        description: 'The auth key in question',
        example: 'aXCv-3dFg-4HjK-5LmN-6PqR',
        minLength: 24,
        maxLength: 24,
    })
    key: string;

    @ApiProperty({
        description: 'The name of the auth key',
    })
    name: string;

    @ApiProperty({
        description: 'Whether the auth key has been revoked',
    })
    revoked: boolean;

    @ApiProperty({
        description: 'The date the auth key was last updated',
        format: 'date-time',
    })
    date: string;
}

export class AuthKeyEntitySchema {
    @ApiProperty({
        description: 'The id of the auth key',
    })
    id: string;

    @ApiProperty({
        description: 'The auth key in question',
        example: 'aXCv-3dFg-4HjK-5LmN-6PqR',
        minLength: 24,
        maxLength: 24,
    })
    authKey: string;

    @ApiProperty({
        description: 'Whether the auth key has been revoked',
    })
    revoked: boolean;

    @ApiProperty({
        description: 'The date the auth key was created',
        format: 'date-time',
    })
    created: string;

    @ApiProperty({
        description: 'The use case of the auth key',
        'enum': UseCase,
    })
    useCase: UseCase;

    @ApiProperty({
        description: 'The date the auth key was last updated',
        format: 'date-time',
    })
    updated: string;

    @ApiProperty({
        description: 'The id of the user who created the auth key',
    })
    userId: string;

    @ApiProperty({
        description: 'The id of the view associated with the auth key',
        nullable: true,
    })
    viewId: string;
}

export class PageResponseAuthKeySchema extends createPageResponse(AuthKeyItemSchema) {}
