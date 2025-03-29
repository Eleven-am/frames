import { IFile } from '@eleven-am/nestjs-storage/src/types/storage';
import { ApiProperty } from '@nestjs/swagger';
import { CloudStorage, CloudDrive, MediaType } from '@prisma/client';

import { createPageResponse } from '../utils/utils.contracts';

export interface FramesFile extends IFile {
    cloudStorageId: string;
}

export interface RecursiveFramesFile extends FramesFile {
    parentName: string;
}

export type SafeStorage = Omit<CloudStorage, 'credentials' | 'userId'>

export class SlimStorageSchema {
    @ApiProperty({
        description: 'The id of the storage',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the storage',
    })
    name: string;

    @ApiProperty({
        description: 'The storage driver of the storage',
        'enum': CloudDrive,
        enumName: 'CloudDrive',
    })
    drive: CloudDrive;
}

export class SafeStorageSchema extends SlimStorageSchema {
    @ApiProperty({
        description: 'The location where movies are stored in the storage',
    })
    movieLocations: string[];

    @ApiProperty({
        description: 'The location where tv shows are stored in the storage',
    })
    showLocations: string[];

    @ApiProperty({
        description: 'The last time the storage was created',
    })
    created: string;

    @ApiProperty({
        description: 'The last time the storage was updated',
    })
    updated: string;
}

export class PageResponseStorageSchema extends createPageResponse(SafeStorageSchema) {}

export class FramesFileSchema {
    @ApiProperty({
        description: 'The name of the file',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The path of the file',
        type: String,
    })
    path: string;

    @ApiProperty({
        description: 'The size of the file',
        type: Number,
    })
    size: number;

    @ApiProperty({
        description: 'The mime type of the file',
        type: String,
        nullable: true,
    })
    mimeType: string | null;

    @ApiProperty({
        description: 'If the file is a folder',
        type: Boolean,
    })
    isFolder: boolean;

    @ApiProperty({
        description: 'The last time the file was modified',
        type: String,
    })
    modifiedAt: string;

    @ApiProperty({
        description: 'The id of the storage',
        type: String,
    })
    cloudStorageId: string;
}

export class ReadFolderSchema extends FramesFileSchema {
    @ApiProperty({
        description: 'The list of files in the folder',
        type: [FramesFileSchema],
    })
    items: FramesFileSchema[];
}

export interface FolderType {
    path: string;
    type: MediaType;
    storageId: string;
}
