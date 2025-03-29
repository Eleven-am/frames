import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Media } from '@prisma/client';

import { SeenResponseSchema } from './seen.contracts';
import { SeenService } from './seen.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { PageResponseSlimMediaSchema } from '../media/media.contracts';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { CachedSession } from '../session/session.contracts';
import { PaginateArgs } from '../utils/utils.contracts';


@Controller('seen')
@ApiTags('Seen')
export class SeenController {
    constructor (private readonly seenService: SeenService) {}

    @Post(':mediaId')
    @ApiMediaId('to be marked as seen')
    @CanPerform(
        {
            action: Action.Create,
            resource: 'SeenMedia',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Mark a media item as seen',
        description: 'Mark a media item as seen',
    })
    @ApiCreatedResponse({
        description: 'The media item has been marked as seen',
        type: SeenResponseSchema,
    })
    create (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession) {
        return this.seenService.create(session.user, media);
    }

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'SeenMedia',
    })
    @ApiOperation({
        summary: 'Get all the media the current user has marked as seen',
        description:
      'Get a list of media items the current user has marked as seen',
    })
    @ApiOkResponse({
        description: 'The list of media items',
        type: PageResponseSlimMediaSchema,
    })
    findAll (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @Query() query: PaginateArgs) {
        return this.seenService.findAll(session.user, ability, query);
    }

    @Get(':mediaId')
    @ApiMediaId('to be checked if seen')
    @ApiOperation({
        summary: 'Check if a media item has been marked as seen',
        description: 'Check if a media item has been marked as seen',
    })
    @CanPerform(
        {
            action: Action.Read,
            resource: 'SeenMedia',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOkResponse({
        description: 'The media item has been marked as seen',
        type: SeenResponseSchema,
    })
    findOne (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession) {
        return this.seenService.findOne(session.user, media);
    }

    @Delete(':mediaId')
    @ApiMediaId('to be removed from seen')
    @ApiOperation({
        summary: 'Remove a media item from the seen list',
        description: 'Remove a media item from the seen list',
    })
    @CanPerform(
        {
            action: Action.Delete,
            resource: 'SeenMedia',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOkResponse({
        description: 'The media item has been removed from the seen list',
        type: SeenResponseSchema,
    })
    remove (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession) {
        return this.seenService.remove(session.user, media);
    }
}
