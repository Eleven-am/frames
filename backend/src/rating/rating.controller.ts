import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Media } from '@prisma/client';

import { RatingResponseSchema } from './rating.contracts';
import { RatingService } from './rating.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { HomeResponseSlimMediaSchema } from '../media/media.contracts';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { CachedSession } from '../session/session.contracts';


@Controller('rating')
@ApiTags('Rating')
export class RatingController {
    constructor (private readonly ratingService: RatingService) {}

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'Rating',
    })
    @ApiOperation({
        summary: 'Get the ratings for the current user',
        description:
      'Get a list of media items the current user has rated positively',
    })
    @ApiOkResponse({
        description: 'The list of media items the user has rated positively',
        type: HomeResponseSlimMediaSchema,
    })
    findAll (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.ratingService.findAll(ability);
    }

    @Get(':mediaId')
    @ApiMediaId('to find the rating for')
    @CanPerform(
        {
            action: Action.Read,
            resource: 'Rating',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Get the rating for a media item',
        description: 'Get the rating for a media item',
    })
    @ApiOkResponse({
        description: 'The rating for the media item',
        type: RatingResponseSchema,
    })
    findOne (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.ratingService.findOne(session.user, media);
    }

    @Delete(':mediaId')
    @CanPerform(
        {
            action: Action.Delete,
            resource: 'Rating',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Remove a rating',
        description: 'Remove a rating for a media item',
    })
    @ApiMediaId('to remove the rating for')
    @ApiOkResponse({
        description: 'The rating has been removed',
        type: RatingResponseSchema,
    })
    remove (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.ratingService.remove(session.user, media);
    }

    @Put('positive/:mediaId')
    @CanPerform(
        {
            action: Action.Create,
            resource: 'Rating',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Rate a media item positively',
        description: 'Rate a media item positively',
    })
    @ApiMediaId('to rate positively')
    @ApiOkResponse({
        description: 'The media item has been rated positively',
        type: RatingResponseSchema,
    })
    ratePositive (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.ratingService.ratePositive(session.user, media);
    }

    @Put('negative/:mediaId')
    @CanPerform(
        {
            action: Action.Create,
            resource: 'Rating',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Rate a media item negatively',
        description: 'Rate a media item negatively',
    })
    @ApiMediaId('to rate negatively')
    @ApiOkResponse({
        description: 'The media item has been rated negatively',
        type: RatingResponseSchema,
    })
    rateNegative (@CurrentSession.HTTP() session: CachedSession, @CurrentMedia() media: Media) {
        return this.ratingService.rateNegative(session.user, media);
    }
}
