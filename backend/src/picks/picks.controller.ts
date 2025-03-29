import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Body, Controller, Delete, Get, Post, Query, Patch } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PickCategory, Media } from '@prisma/client';
import { HomeResponseSlimMediaSchema, SlimMediaSchema } from '../media/media.contracts';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { ApiOkFramesResponse } from '../utils/utils.decorators';

import {
    GetPicksArgs,
    PickCountSchema,
    PageResponsePickSchema,
    UpdatePicksArgs,
    PickResponseSchema,
    CreatePicksArgs,
    GetPaginatedPicksArgs,
    DeletePicksArgs,
} from './picks.contracts';
import { CurrentPickCategory, ApiPickCategoryId } from './picks.decorators';
import { PicksService } from './picks.service';


@Controller('picks')
@ApiTags('Picks')
export class PicksController {
    constructor (private readonly picksService: PicksService) {}

    @Post()
    @ApiOperation({
        summary: 'Create a new pick category',
        description: 'Create a new pick category',
    })
    @ApiCreatedResponse({
        description: 'The new pick category',
        type: PickResponseSchema,
    })
    @CanPerform({
        action: Action.Create,
        resource: 'PickCategory',
    })
    createPickCategory (@Body() args: CreatePicksArgs) {
        return this.picksService.createPickCategory(args);
    }

    @Patch()
    @ApiOperation({
        summary: 'Get all picks',
        description: 'Get all picks',
    })
    @ApiOkResponse({
        description: 'The list of pick categories',
        type: PageResponsePickSchema,
    })
    getPicks (@CurrentAbility.HTTP() ability: AppAbilityType, @Body() body: GetPaginatedPicksArgs) {
        return this.picksService.getPicks(body, ability);
    }

    @Get('index')
    @ApiOperation({
        summary: 'Get the picks for a given index and type',
        description: 'Get a list of picks for a given index and type',
    })
    @ApiOkResponse({
        description: 'The list of media items for the index and type',
        type: HomeResponseSlimMediaSchema,
    })
    @CanPerform(
        {
            action: Action.Read,
            resource: 'PickCategory',
        },
        {
            action: Action.Read,
            resource: 'PickItem',
        },
    )
    getPicksByIndex (@Query() args: GetPicksArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.picksService.getPickForHomeScreen(args, ability);
    }

    @Get('count')
    @ApiOperation({
        summary: 'Get the count of picks',
        description: 'Get the count of picks for the editor and basic picks',
    })
    @ApiOkResponse({
        description: 'The count of picks',
        type: PickCountSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'PickCategory',
    })
    getPicksCount () {
        return this.picksService.getPickCounts();
    }

    @Get('trending')
    @ApiOperation({
        summary: 'Get the trending picks',
        description: 'Get the trending picks',
    })
    @ApiOkResponse({
        description: 'The list of trending picks',
        type: SlimMediaSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'PickCategory',
    })
    getSelectedTrending (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.picksService.getSelectedTrending(ability);
    }

    @Patch(':categoryId')
    @ApiPickCategoryId('to be updated')
    @ApiOperation({
        summary: 'Update the picks for a category',
        description: 'Update the details for a given pick category',
    })
    @ApiCreatedResponse({
        description: 'The updated pick category',
        type: PickResponseSchema,
    })
    @CanPerform({
        action: Action.Update,
        resource: 'PickCategory',
    })
    updatePickCategory (@CurrentPickCategory() category: PickCategory, @Body() args: UpdatePicksArgs) {
        return this.picksService.updatePickCategory(category, args);
    }

    @Delete()
    @ApiOperation({
        summary: 'Delete the picks for a list of categories',
        description: 'Delete the picks for a given list of categories',
    })
    @ApiOkFramesResponse('The picks have been deleted')
    @CanPerform({
        action: Action.Delete,
        resource: 'PickCategory',
    })
    deletePicks (@Body() body: DeletePicksArgs) {
        return this.picksService.deletePicksCategory(body);
    }

    @Get(':categoryId')
    @ApiPickCategoryId('to be fetched')
    @ApiOperation({
        summary: 'Get a pick category',
        description: 'Get a pick category by id',
    })
    @ApiOkResponse({
        description: 'The pick category',
        type: PickResponseSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'PickCategory',
    })
    getPickCategory (@CurrentPickCategory() category: PickCategory) {
        return this.picksService.getPickCategory(category);
    }

    @Patch('trending/:mediaId')
    @ApiMediaId('to add to trending picks')
    @ApiOperation({
        summary: 'Add a media item to trending picks',
        description: 'Add a media item to trending picks',
    })
    @ApiOkResponse({
        description: 'The updated pick category',
        type: PickResponseSchema,
    })
    @CanPerform(
        {
            action: Action.Update,
            resource: 'PickCategory',
        },
        {
            action: Action.Update,
            resource: 'PickItem',
        },
    )
    addMediaToTrendingPicks (@CurrentMedia() media: Media) {
        return this.picksService.setMediaAsSelectedTrending(media);
    }
}
