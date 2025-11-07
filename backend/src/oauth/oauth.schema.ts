import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsDate } from 'class-validator';
import { Details } from 'express-useragent';
import { z } from 'zod';

import { createPageResponse } from '../utils/utils.contracts';

export class CreateOauthClientArgs {
    @ApiProperty({
        description: 'The name of the oauth client',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The client id',
    })
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty({
        description: 'The client secret',
    })
    @IsString()
    @IsNotEmpty()
    clientSecret: string;

    @ApiProperty({
        description: 'The text to display on the button',
    })
    @IsString()
    @IsNotEmpty()
    buttonLabel: string;

    @ApiProperty({
        description: 'The color of the button',
    })
    @IsString()
    @IsNotEmpty()
    color: string;

    @ApiProperty({
        description: 'The token host',
    })
    @IsString()
    @IsNotEmpty()
    tokenHost: string;

    @ApiProperty({
        description: 'The authorize host',
    })
    @IsString()
    @IsNotEmpty()
    authorizeHost: string;

    @ApiProperty({
        description: 'The token path',
    })
    @IsString()
    @IsNotEmpty()
    tokenPath: string;

    @ApiProperty({
        description: 'The authorize path',
    })
    @IsString()
    @IsNotEmpty()
    authorizePath: string;

    @ApiProperty({
        description: 'The url to get user data',
    })
    @IsString()
    @IsNotEmpty()
    userDataUrl: string;

    @ApiProperty({
        description: 'The logo url of the oauth client',
    })
    @IsString()
    @IsNotEmpty()
    logo: string;

    @ApiProperty({
        description: 'The scopes of the oauth client',
    })
    @IsArray()
    @IsString({ each: true })
    scopes: string[];
}

export class UpdateOauthClientArgs extends CreateOauthClientArgs {
    @ApiProperty({
        description: 'The oauth client id',
    })
    @IsString()
    @IsNotEmpty()
    id: string;
}

const emailSchema = z.object({
    email: z.string()
        .email(),
});

const mailSchema = z.object({
    mail: z.string()
        .email(),
});

export const profileSchema = z.union([emailSchema, mailSchema]);

export interface OauthStateData {
    ip: string;
    details: Details;
}

export interface OauthResponseData extends OauthStateData {
    email: string;
    username: string;
}

export interface PassKeyData {
    challenge: string;
    email: string;
}

export enum OauthAction {
    AUTH_KEY = 'auth_key',
    LOGIN = 'login',
}

export class OauthParams {
    @ApiProperty({
        description: 'The oauth provider id',
    })
    @IsString()
    provider: string;
}

export class OauthClientSchema extends CreateOauthClientArgs {
    @ApiProperty({
        description: 'The id of the oauth client',
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'The created date',
    })
    @IsDate()
    created: Date;

    @ApiProperty({
        description: 'The updated date',
    })
    @IsDate()
    updated: Date;
}

export class OauthSlimClientSchema {
    @ApiProperty({
        description: 'The id of the oauth client',
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'The text to display on the button',
    })
    @IsString()
    @IsNotEmpty()
    buttonLabel: string;

    @ApiProperty({
        description: 'The logo url of the oauth client',
    })
    @IsString()
    @IsNotEmpty()
    logo: string;

    @ApiProperty({
        description: 'The color of the button',
    })
    @IsString()
    @IsNotEmpty()
    color: string;

    @ApiProperty({
        description: 'The name of the oauth client',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class PageResponseOauthClientSchema extends createPageResponse(OauthSlimClientSchema) {}
