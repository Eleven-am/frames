import { CanPerform, Action, CurrentAbility, AppAbilityType } from '@eleven-am/authorizer';
import { Controller, Post, Get, Res } from '@nestjs/common';
import { ApiProduces, ApiOkResponse, ApiOperation, ApiCreatedResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { AuthKey, Download } from '@prisma/client';
import { Response } from 'express';

import { DownloadsSchema, DownloadItemSchema } from './downloads.contracts';
import { CurrentDownload } from './downloads.decorators';
import { DownloadsService } from './downloads.service';
import { CurrentAuthKey } from '../authkey/authkey.decorators';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CurrentPlayback } from '../playback/playback.decorators';
import { Playback } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { ApiParamId } from '../utils/utils.decorators';


@Controller('downloads')
@ApiTags('Downloads')
export class DownloadsController {
    constructor (private readonly downloadsService: DownloadsService) {}

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'Download',
    })
    @ApiOperation({
        summary: 'Get all downloads',
        description: 'Get all downloads',
    })
    @ApiOkResponse({
        description: 'Downloads retrieved successfully',
        type: DownloadItemSchema,
        isArray: true,
    })
    getAll (@CurrentSession.HTTP() { language }: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.downloadsService.listDownloads(ability, language);
    }

    @Get(':downloadId')
    @ApiParamId('download', 'to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'Download',
    })
    @ApiOperation({
        summary: 'Downloads a file',
        description: 'Downloads a file using the download id, valid for 2 hours',
    })
    @ApiOkResponse({
        description: 'File downloaded successfully',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('application/octet-stream')
    download (@CurrentSession.HTTP() { language }: CachedSession, @CurrentDownload() download: Download, @Res({ passthrough: true }) res: Response) {
        return this.downloadsService.downloadFile(download, res, language);
    }

    @Post(':playbackId/:authKey')
    @ApiParamId('playback', 'to create a download for')
    @ApiParam({
        name: 'authKey',
        type: String,
        description: 'The auth key to use for the download',
    })
    @CanPerform(
        {
            action: Action.Create,
            resource: 'Download',
        },
        {
            action: Action.Read,
            resource: 'View',
        },
        {
            action: Action.Update,
            resource: 'AuthKey',
        },
    )
    @ApiOperation({
        summary: 'Create a download url',
        description: 'Create download for a playback session using an auth key',
    })
    @ApiCreatedResponse({
        description: 'Download created successfully',
        type: DownloadsSchema,
    })
    create (@CurrentSession.HTTP() { user }: CachedSession, @CurrentPlayback() playback: Playback, @CurrentAuthKey() authKey: AuthKey) {
        return this.downloadsService.create(playback, authKey, user);
    }
}
