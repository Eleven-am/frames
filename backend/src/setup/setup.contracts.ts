import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, Matches, IsEnum, IsOptional, IsArray } from 'class-validator';
import SMTPConnection from 'nodemailer/lib/smtp-connection';

import { LoginParams } from '../authentication/auth.contracts';

export class TmdbApiKeyParams {
    @ApiProperty({
        description: 'The API key for The Movie Database',
        type: String,
    })
    @IsString()
    tmdbApiKey: string;
}

export class FanArtTvApiKeyParams {
    @ApiProperty({
        description: 'The API key for FanArtTv',
        type: String,
    })
    @IsString()
    fanArtTvApiKey: string;
}

export class OpenAiApiKeyParams {
    @ApiProperty({
        description: 'The API key for OpenAi',
        type: String,
    })
    @IsString()
    openAiApiKey: string;
}

export enum OauthProvider {
    DROPBOX = 'DROPBOX',
    DRIVE = 'DRIVE',
}

export class MailServerParams {
    @ApiProperty({
        description: 'The host of the mail server',
        type: String,
    })
    @IsString()
    host: string;

    @IsNumber({
        maxDecimalPlaces: 0,
        allowInfinity: false,
    })
    @ApiProperty({
        description: 'The port of the mail server',
        type: 'number',
    })
    @Min(1)
    @Type(() => Number)
    port: number;

    @ApiProperty({
        description: 'The user of the mail server',
        type: String,
    })
    @IsString()
    user: string;

    @ApiProperty({
        description: 'The password to the mail server',
        type: String,
    })
    @IsString()
    pass: string;

    @ApiProperty({
        description: 'The domain of the mail server',
        type: String,
    })
    @IsString()
    domain: string;
}

export class OpenSubtitlesParams {
    @ApiProperty({
        description: 'The user agent for OpenSubtitles',
        type: String,
    })
    @IsString()
    userAgent: string;

    @ApiProperty({
        description: 'The username for OpenSubtitles',
        type: String,
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'The password for OpenSubtitles',
        type: String,
    })
    @IsString()
    password: string;
}

export class AdminAccountParams extends LoginParams {
    @ApiProperty({
        description: 'The username',
        minLength: 3,
        maxLength: 20,
    })
    @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
        message: 'Username must contain only letters, numbers, underscores, and hyphens',
    })
    username: string;
}

export class OauthClientParams {
    @ApiProperty({
        description: 'The name of the Cloud service',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The client id of the oauth client',
    })
    @IsString()
    clientId: string;

    @ApiProperty({
        description: 'The client secret of the oauth client',
    })
    @IsString()
    clientSecret: string;

    @ApiProperty({
        description: 'The provider of the oauth client',
        'enum': OauthProvider,
        enumName: 'OauthProvider',
    })
    @IsEnum(OauthProvider)
    provider: OauthProvider;
}

export class ReadFolderArgs {
    @ApiProperty({
        description: 'The path to the folder',
        required: false,
    })
    @IsString()
    @IsOptional()
    path?: string;

    @ApiProperty({
        description: 'The id of the storage',
        required: true,
    })
    @IsString()
    cloudStorageId: string;
}

export class UpdateSetupStorageArgs {
    @ApiProperty({
        description: 'The id of the storage',
    })
    @IsString()
    cloudStorageId: string;

    @ApiProperty({
        description: 'The list of locations to scan for movies',
        type: [String],
    })
    @IsString({ each: true })
    @IsArray()
    movieLocations: string[];

    @ApiProperty({
        description: 'The list of locations to scan for shows',
        type: [String],
    })
    @IsString({ each: true })
    @IsArray()
    showLocations: string[];
}

export class S3Params {
    @ApiProperty({
        description: 'The access key for the S3 bucket',
        type: String,
    })
    @IsString()
    accessKeyId: string;

    @ApiProperty({
        description: 'The secret key for the S3 bucket',
        type: String,
    })
    @IsString()
    secretAccessKey: string;

    @ApiProperty({
        description: 'The region for the S3 bucket',
        type: String,
    })
    @IsString()
    region: string;

    @ApiProperty({
        description: 'The bucket name for the S3 bucket',
        type: String,
    })
    @IsString()
    bucket: string;

    @ApiProperty({
        description: 'The endpoint for the S3 bucket',
        type: String,
    })
    @IsString()
    endpoint: string;

    @ApiProperty({
        description: 'The folder for the S3 bucket',
        type: String,
    })
    @IsString()
    name: string;
}

export class SetupConfigurationSchema {
    @ApiProperty({
        description: 'Whether the TMDB API Key has been configured',
        type: Boolean,
    })
    tmdbConfigured: boolean;

    @ApiProperty({
        description: 'Whether the FanArt API Key has been configured',
        type: Boolean,
    })
    fanArtConfigured: boolean;

    @ApiProperty({
        description: 'Whether the OpenAI API Key has been configured',
        type: Boolean,
    })
    openaiConfigured: boolean;

    @ApiProperty({
        description: 'Whether the OpenSubtitles configuration has been configured',
        type: Boolean,
    })
    openSubtitlesConfigured: boolean;

    @ApiProperty({
        description: 'Whether the Mail configuration has been configured',
        type: Boolean,
    })
    mailServerConfigured: boolean;

    @ApiProperty({
        description: 'The number of storages that have been configured',
        type: Number,
    })
    storagesConfigured: number;

    @ApiProperty({
        description: 'Whether the admin account has been configured',
        type: Boolean,
    })
    adminConfigured: boolean;
}

export interface MailData {
    config: SMTPConnection.Options;
    domain: string;
}
