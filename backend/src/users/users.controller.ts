import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Controller, Get, Body, Patch, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Media } from '@prisma/client';

import { UpdateUserArgs, PromoteUsersArgs, BulkUsersArgs, GetActivityArgs, BulkItemsArgs } from './user.args';
import {
    UserMediaDetailsResponseSchema,
    HomeResponseContinueWatchingSchema,
    PageResponseSlimFrontUserSchema,
    ProfileDetailsSchema,
    PageResponseHistorySchema,
} from './user.schema';
import { UsersService } from './users.service';
import { UsernameParams } from '../authentication/auth.contracts';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CurrentLanguage, ApiLanguage } from '../language/language.decorators';
import { LanguageReturn } from '../language/language.types';
import { HomeResponseSlimMediaSchema } from '../media/media.contracts';
import { CurrentMedia, ApiMediaId } from '../media/media.decorators';
import { CachedSession, SessionSchema } from '../session/session.contracts';
import { MetadataSchema } from '../socket/socket.schema';
import { PaginateArgs } from '../utils/utils.contracts';
import { ApiOkFramesResponse } from '../utils/utils.decorators';


@Controller('users')
@ApiTags('Users')
export class UsersController {
    constructor (private readonly usersService: UsersService) {}

    @Get('media/:mediaId')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get the user\'s details for a media',
        description: 'Get the user\'s details for a media, including whether the media is in the user\'s list, the user\'s rating of the media, the user\'s seen status of the media, and whether the user can modify the media',
    })
    @ApiMediaId('to get the user\'s details for')
    @ApiOkResponse({
        description: 'The user\'s details for the media',
        type: UserMediaDetailsResponseSchema,
    })
    getMediaDetails (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession) {
        return this.usersService.getMediaDetails(media, session.user);
    }

    @ApiLanguage()
    @Patch('language/:language')
    @CanPerform({
        action: Action.Update,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Update the user\'s language',
        description: 'Update the user\'s language',
    })
    @ApiOkResponse({
        description: 'A new Session with the updated language',
        type: SessionSchema,
    })
    updateLanguage (@CurrentLanguage() language: LanguageReturn, @CurrentSession.HTTP() { user }: CachedSession) {
        return this.usersService.updateLanguage(user, language);
    }

    @Patch('data')
    @CanPerform({
        action: Action.Update,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Update the user\'s settings',
        description: 'Update the user\'s settings',
    })
    @ApiOkResponse({
        description: 'The updated user',
        type: SessionSchema,
    })
    updateUserData (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: UpdateUserArgs) {
        return this.usersService.updateUserData(user, body);
    }

    @Patch('username')
    @CanPerform({
        action: Action.Update,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Update the user\'s settings',
        description: 'Update the user\'s settings',
    })
    @ApiOkResponse({
        description: 'The updated user',
        type: SessionSchema,
    })
    updateUsername (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: UsernameParams) {
        return this.usersService.updateUsername(user, body);
    }

    @Get('continue-watching')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get the user\'s continue watching list',
        description: 'Get the user\'s continue watching list',
    })
    @ApiOkResponse({
        description: 'The user\'s continue watching list',
        type: HomeResponseContinueWatchingSchema,
    })
    getContinueWatching (@CurrentSession.HTTP() { user, language }: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.usersService.getContinueWatching(user, ability, language);
    }

    @Get('recommendations')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get the user\'s recommendations',
        description: 'Get the user\'s recommendations based on their activity',
    })
    @ApiOkResponse({
        description: 'The user\'s media recommendations',
        type: HomeResponseSlimMediaSchema,
    })
    getRecommendations (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.usersService.getRecommendations(ability);
    }

    @Get('streaming-session')
    @CanPerform({
        action: Action.Read,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Get the user\'s streaming session',
        description: 'Get the user\'s streaming session if the user is currently streaming on another device',
    })
    @ApiOkResponse({
        description: 'The user\'s streaming session',
        type: MetadataSchema,
    })
    getStreamingSession (@CurrentSession.HTTP() session: CachedSession) {
        return this.usersService.getStreamingSession(session);
    }

    @Get('users')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Get all users',
        description: 'Get the list of all users with their details',
    })
    @ApiOkResponse({
        description: 'The list of all users',
        type: PageResponseSlimFrontUserSchema,
    })
    getUsers (@Query() pagination: PaginateArgs) {
        return this.usersService.getUsers(pagination);
    }

    @Patch('activity')
    @CanPerform({
        action: Action.Read,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Get the user\'s activity',
        description: 'Get all the user\'s activity, searchable and paginated',
    })
    @ApiOkResponse({
        description: 'The user\'s activity',
        type: PageResponseHistorySchema,
    })
    getActivity (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: GetActivityArgs) {
        return this.usersService.getActivity(user, body);
    }

    @Patch('promote')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Promote users',
        description: 'Promote users to a specific role',
    })
    @ApiOkFramesResponse('The users have been promoted')
    promoteUsers (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: PromoteUsersArgs) {
        return this.usersService.promoteUsers(user, body.userIds, body.role);
    }

    @Patch('revoke')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Revoke users',
        description: 'Revoke access to the platform for users',
    })
    @ApiOkFramesResponse('The users have been revoked')
    revokeUsersAccess (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: BulkUsersArgs) {
        return this.usersService.revokeUsersAccess(user, body.userIds);
    }

    @Patch('confirm')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Confirm users',
        description: 'Confirm users manually. Useful frames has not been configured with an SMTP server',
    })
    @ApiOkFramesResponse('The users have been activated')
    confirmUsers (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: BulkUsersArgs) {
        return this.usersService.confirmUsers(user, body.userIds);
    }

    @Patch('grant-access')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Grant users access',
        description: 'Grant revoked users access to the platform',
    })
    @ApiOkFramesResponse('The users access has been granted')
    grantUsersAccess (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: BulkUsersArgs) {
        return this.usersService.grantUsersAccess(user, body.userIds);
    }

    @Delete('users')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Delete users',
        description: 'Delete users from the platform',
    })
    @ApiOkFramesResponse('The users have been deleted')
    deleteUsers (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: BulkUsersArgs) {
        return this.usersService.deleteUsers(user, body.userIds);
    }

    @Delete('items')
    @CanPerform({
        action: Action.Manage,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Delete users',
        description: 'Delete items from the platform for a specific user',
    })
    @ApiOkFramesResponse('The items have been deleted')
    deleteItems (@CurrentSession.HTTP() { user }: CachedSession, @Body() body: BulkItemsArgs) {
        return this.usersService.deleteItems(user, body.itemIds);
    }

    @Get('details')
    @CanPerform({
        action: Action.Read,
        resource: 'User',
    })
    @ApiOperation({
        summary: 'Get the user\'s details',
        description: 'Get the user\'s details',
    })
    @ApiOkResponse({
        description: 'The user\'s details',
        type: ProfileDetailsSchema,
    })
    getProfileDetails (@CurrentSession.HTTP() session: CachedSession) {
        return this.usersService.getProfileDetails(session);
    }
}
