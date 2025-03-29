import { CanPerform, Action } from '@eleven-am/authorizer';
import { Controller, Get, Post, Body, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CloudStorage } from '@prisma/client';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';
import { PaginateArgs } from '../utils/utils.contracts';
import { ApiOkFramesResponse } from '../utils/utils.decorators';

import { CreateStorageArgs, UpdateStorageArgs } from './storage.args';
import { DeleteFileArgs } from './storage.contracts';
import { CurrentStorage, ApiStorageId } from './storage.decorators';
import { SafeStorageSchema, PageResponseStorageSchema } from './storage.schema';
import { StorageService } from './storage.service';


@Controller('storage')
@ApiTags('Storage')
export class StorageController {
    constructor (private readonly storageService: StorageService) {}

    @Post()
    @CanPerform({
        action: Action.Create,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Create a new storage',
        description:
          'Create a new storage with the given details and return the new storage object',
    })
    @ApiCreatedResponse({
        description: 'The storage has been successfully created',
        type: SafeStorageSchema,
    })
    create (@CurrentSession.HTTP() { user }: CachedSession, @Body() createStorageDto: CreateStorageArgs) {
        return this.storageService.create(user, createStorageDto);
    }

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Get all storages',
        description: 'Get all storages the current user has access to',
    })
    @ApiOkResponse({
        description: 'The storages have been successfully fetched',
        type: PageResponseStorageSchema,
    })
    findAll (@Query() paginated: PaginateArgs) {
        return this.storageService.findAll(paginated);
    }

    @Patch(':storageId')
    @CanPerform({
        action: Action.Update,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Update a storage',
        description: 'Update details of a storage with the given Id',
    })
    @ApiOkResponse({
        description: 'The storage has been successfully updated',
        type: SafeStorageSchema,
    })
    @ApiStorageId('to be updated')
    update (@CurrentStorage() storage: CloudStorage, @Body() updateStorageDto: UpdateStorageArgs) {
        return this.storageService.update(storage, updateStorageDto);
    }

    @Delete('file/:storageId')
    @CanPerform({
        action: Action.Delete,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Delete a storage',
        description: 'Delete a storage with the given Id',
    })
    @ApiStorageId('to be deleted')
    @ApiOkResponse({
        description: 'The storage has been successfully deleted',
        type: Boolean,
    })
    removeFile (@Body() deleteFileArgs: DeleteFileArgs) {
        return this.storageService.deleteFileOrFolder(deleteFileArgs.storageId, deleteFileArgs.filepath);
    }

    @Delete(':storageId')
    @CanPerform({
        action: Action.Delete,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Delete a storage',
        description: 'Delete a storage with the given Id',
    })
    @ApiStorageId('to be deleted')
    @ApiOkFramesResponse('The storage was deleted successfully')
    remove (@CurrentStorage() storage: CloudStorage) {
        return this.storageService.remove(storage);
    }
}
