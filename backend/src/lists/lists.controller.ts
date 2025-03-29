import { AppAbilityType, CanPerform, Action, CurrentAbility } from '@eleven-am/authorizer';
import { Controller, Delete, Get, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Media } from '@prisma/client';

import { PlayMyListArgs, IsInListResponseSchema } from './lists.contracts';
import { ListsService } from './lists.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { DetailedMediaSchema, HomeResponseSlimMediaSchema } from '../media/media.contracts';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { PlaybackSessionSchema } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';


@Controller('lists')
@ApiTags('Lists')
export class ListsController {
    constructor (private readonly listsService: ListsService) {}

    @Get()
    @ApiOperation({
        summary: 'Get the lists for the current user',
        description:
      'Get a list of media items the current user has added to their list',
    })
    @ApiOkResponse({
        description: 'The list of media items',
        type: HomeResponseSlimMediaSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'ListItem',
    })
    getLists (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.listsService.getListsForHome(ability);
    }

    @Get('page')
    @ApiOperation({
        summary: 'Get the lists for the current user with additional information',
        description:
      'Get a list of media items the current user has added to their list. This includes additional information they view on the list page',
    })
    @ApiOkResponse({
        description: 'The list of media items',
        type: [DetailedMediaSchema],
    })
    @CanPerform({
        action: Action.Read,
        resource: 'ListItem',
    })
    getListsPage (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.listsService.getListsPage(ability, session.language);
    }

    @Get('play')
    @ApiOperation({
        summary: 'Plays all the media items in the list',
        description: 'Plays all the media items in the current user list',
    })
    @ApiOkResponse({
        description: 'The list of media items',
        type: PlaybackSessionSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'ListItem',
    })
    playMyList (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @Query() playArgs: PlayMyListArgs) {
        return this.listsService.playMyList(session, ability, playArgs);
    }

    @Put('add/:mediaId')
    @ApiMediaId('to be added to the list')
    @ApiOperation({
        summary: 'Add a media item to the list',
        description: 'Add a media item to the current user list',
    })
    @CanPerform(
        {
            action: Action.Create,
            resource: 'ListItem',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOkResponse({
        description: 'The media item has been added to the list',
        type: IsInListResponseSchema,
    })
    addToList (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.listsService.addToList(session.user, media);
    }

    @Delete('remove/:mediaId')
    @ApiMediaId('to be removed from the list')
    @ApiOperation({
        summary: 'Remove a media item from the list',
        description: 'Remove a media item from the current user list',
    })
    @ApiOkResponse({
        description: 'The media item has been removed from the list',
        type: IsInListResponseSchema,
    })
    @CanPerform(
        {
            action: Action.Delete,
            resource: 'ListItem',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    removeFromList (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.listsService.removeFromList(session.user, media);
    }

    @Get(':mediaId')
    @ApiMediaId('to be checked in the list')
    @ApiOperation({
        summary: 'Check if a media item is in the list',
        description: 'Check if a media item is in the current user list',
    })
    @ApiOkResponse({
        description: 'The media item has been checked',
        type: IsInListResponseSchema,
    })
    @CanPerform(
        {
            action: Action.Read,
            resource: 'ListItem',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    checkList (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.listsService.checkList(session.user, media);
    }
}
