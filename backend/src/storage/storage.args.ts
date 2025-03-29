import { ApiProperty } from '@nestjs/swagger';
import { CloudDrive } from '@prisma/client';
import { IsEnum, IsString, IsArray, IsNotEmpty, ArrayMinSize, IsJSON } from 'class-validator';
import { z } from 'zod';

export class CreateStorageArgs {
    @ApiProperty({
        description: 'The provider to use for the storage',
        'enum': CloudDrive,
    })
    @IsEnum(CloudDrive)
    drive: CloudDrive;

    @ApiProperty({
        description: 'The name of the storage',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ApiProperty({
        description: 'The locations where movies are stored',
    })
    movieLocations: string[];

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ApiProperty({
        description: 'The locations where shows are stored',
    })
    showLocations: string[];

    @IsString()
    @IsJSON()
    @ApiProperty({
        description: 'The credentials to use for the storage',
    })
    credentials: string;
}

export class UpdateStorageArgs {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The storage id',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the storage',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ApiProperty({
        description: 'The locations where movies are stored',
    })
    movieLocations: string[];

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ApiProperty({
        description: 'The locations where shows are stored',
    })
    showLocations: string[];
}

export const oauthCredentialsSchema = z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    refreshToken: z.string(),
});

export const objectStorageCredentialsSchema = z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    endpoint: z.string(),
    bucket: z.string(),
    region: z.string().optional(),
});

export const localCredentialsSchema = z.object({
    root: z.string(),
});

export const storageCredentialsSchema = z.union([
    oauthCredentialsSchema,
    objectStorageCredentialsSchema,
    localCredentialsSchema,
]);
