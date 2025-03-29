import { ApiProperty } from '@nestjs/swagger';
import { Role, Session, User } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';
import { z } from 'zod';

import { LanguageReturn } from '../language/language.types';

export const LocationSchema = z.object({
    status: z.string(),
    country: z.string(),
    countryCode: z.string(),
    region: z.string(),
    regionName: z.string(),
    city: z.string(),
});

export const cookieSchema = z.object({
    browserId: z.string().uuid(),
    sessionId: z.string(),
    userId: z.string(),
    valid: z.coerce.date(),
    language: z.string().min(2),
});

const clientUserSchema = z.object({
    role: z.nativeEnum(Role)
        .describe('The role of the user'),
    email: z.string().email()
        .describe('The email of the user'),
    channel: z.string()
        .describe('The channel of the user'),
    browserId: z.string()
        .describe('The browser id of the current session'),
    username: z.string()
        .describe('The username of the user'),
    incognito: z.boolean()
        .describe('Whether the user is visible to others'),
});

export const sessionSchema = z.object({
    token: z.string(),
    user: clientUserSchema,
});

export type Cookie = z.infer<typeof cookieSchema>;
export type ClientUser = z.infer<typeof clientUserSchema>;
export type FramesSession = z.infer<typeof sessionSchema>;
export type TempSession = Session & { user: User };
export type CachedSession = Session & { user: User, language: LanguageReturn };

export class ClientUserSchema {
    @ApiProperty({
        description: 'The role of the user',
        'enum': Role,
        enumName: 'Role',
    })
    role: Role;

    @IsString()
    @ApiProperty({
        description: 'The email of the user',
        format: 'email',
    })
    email: string;

    @IsString()
    @ApiProperty({
        description: 'The channel of the user',
        type: 'string',
    })
    channel: string;

    @IsString()
    @ApiProperty({
        description: 'The browser id of the current session',
        type: 'string',
    })
    browserId: string;

    @IsString()
    @ApiProperty({
        description: 'The username of the user',
        type: 'string',
    })
    username: string;

    @ApiProperty({
        description: 'Whether the user is visible to others',
        type: 'boolean',
    })
    incognito: boolean;
}

export class SessionSchema {
    @IsString()
    @ApiProperty({
        description: 'The session token',
        type: 'string',
    })
    token: string;

    @Type(() => ClientUserSchema)
    @ApiProperty({
        description: 'The user of the session',
        type: ClientUserSchema,
    })
    user: ClientUserSchema;
}
