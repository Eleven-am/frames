import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export type RepoName = [string, string];

export const dockerTagSchema = z.object({
    name: z.string(),
    full_size: z.number(),
    last_updated: z.string(),
    last_updater_username: z.string(),
    digest: z.string(),
    tag_status: z.string(),
})

export const dockerResultsSchema = z.object({
    results: dockerTagSchema.array(),
})

export interface DockerTag extends Omit<z.infer<typeof dockerTagSchema>, 'last_updated'> {
    last_updated: Date;
}

export const versionInfoSchema = z.object({
    currentVersion: z.string(),
    latestVersion: z.string(),
    latestCreated: z.date(),
    isLatest: z.boolean(),
    checkedAt: z.date(),
});

export type VersionInfo = z.infer<typeof versionInfoSchema>;

export class VersionInfoSchema {
    @ApiProperty({
        type: String,
        description: 'Current version of the Docker image',
    })
    currentVersion: string;

    @ApiProperty({
        type: String,
        description: 'Latest version of the Docker image',
    })
    latestVersion: string;

    @ApiProperty({
        type: Date,
        description: 'Date the latest version was created',
    })
    latestCreated: Date;

    @ApiProperty({
        type: Boolean,
        description: 'Whether the current version is the latest',
    })
    isLatest: boolean;

    @ApiProperty({
        type: Date,
        description: 'Date the version check was performed',
    })
    checkedAt: Date;
}
