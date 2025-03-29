import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Video } from '@prisma/client';

import { ApiPlaybackId, CurrentPlayback, CurrentVideo } from './playback.decorators';
import {
    Playback,
    PlaybackSessionSchema,
    UpdatePlaybackInformSchema,
    UpNextDetailsSchema,
    ProgressPlaybackParams,
} from './playback.schema';
import { PlaybackService } from './playback.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';
import { ApiOkFramesResponse, ApiParamId } from '../utils/utils.decorators';


@Controller('playback')
@ApiTags('Playback')
export class PlaybackController {
    constructor (private readonly playbackService: PlaybackService) {}

    @Get(':playbackId')
    @CanPerform({
        action: Action.Manage,
        resource: 'View',
    })
    @ApiPlaybackId('to get the next video to play')
    @ApiOperation({
        summary: 'Get the next video to play',
        description:
      'Get the next video to play based on the current playback session',
    })
    @ApiOkResponse({
        description: 'The next video to play',
        type: UpNextDetailsSchema,
    })
    getUpNext (@CurrentSession.HTTP() { language }: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentPlayback() playback: Playback) {
        return this.playbackService.getUpNextPlaybackSession(language, ability, playback);
    }

    @Patch(':playbackId')
    @CanPerform({
        action: Action.Update,
        resource: 'View',
    })
    @ApiPlaybackId('to update th playback progress')
    @ApiOperation({
        summary: 'Update the playback progress',
        description: 'Update the playback progress for the current session',
    })
    @ApiOkFramesResponse('The playback progress has been updated')
    saveInformation (@CurrentSession.HTTP() { user }: CachedSession, @CurrentPlayback() playback: Playback, @Body() params: ProgressPlaybackParams) {
        return this.playbackService.saveInformation(user, playback, params.percentage);
    }

    @Patch('inform/:playbackId')
    @CanPerform({
        action: Action.Update,
        resource: 'View',
    })
    @ApiPlaybackId('to update the inform status')
    @ApiOperation({
        summary: 'Update the inform status',
        description: 'Update the inform status for the current session',
    })
    @ApiOkFramesResponse('The inform status has been updated')
    updateInform (@CurrentPlayback() playback: Playback, @Body() body: UpdatePlaybackInformSchema) {
        return this.playbackService.updateInform(playback, body);
    }

    @Post(':playbackId')
    @CanPerform(
        {
            action: Action.Create,
            resource: 'View',
        },
        {
            action: Action.Read,
            resource: 'View',
        },
    )
    @ApiPlaybackId('to create a new session from')
    @ApiOperation({
        summary: 'Create a new session from a playback',
        description: 'Create a new session from a playback',
    })
    @ApiCreatedResponse({
        description: 'The new session has been created',
        type: PlaybackSessionSchema,
    })
    createNewSession (@CurrentSession.HTTP() session: CachedSession, @CurrentPlayback() playback: Playback) {
        return this.playbackService.playFromPlaybackSession(session, playback);
    }

    @Delete(':videoId')
    @CanPerform({
        action: Action.Delete,
        resource: 'View',
    })
    @ApiParamId('video', 'whose watch history to delete')
    @ApiOperation({
        summary: 'Remove a video from the watch history',
        description: 'Remove a video from the watch history of the current user',
    })
    @ApiOkFramesResponse('The video has been removed from the watch history')
    deleteVideo (@CurrentSession.HTTP() { user }: CachedSession, @CurrentVideo() video: Video) {
        return this.playbackService.deleteWatchHistory(user, video);
    }

    @Post(':videoId')
    @CanPerform({
        action: Action.Delete,
        resource: 'View',
    })
    @ApiParamId('video', 'whose watch history to add')
    @ApiOperation({
        summary: 'Add a video from the watch history',
        description: 'Add a video from the watch history of the current user',
    })
    @ApiOkFramesResponse('The video has been added to the watch history')
    addVideo (@CurrentSession.HTTP() { user }: CachedSession, @CurrentVideo() video: Video) {
        return this.playbackService.addWatchHistory(user, video);
    }

    @Post('play-video/:videoId')
    @ApiParamId('video', 'whose playback to start')
    @CanPerform({
        action: Action.Create,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Start a video playback',
        description: 'Start a video playback for the current user',
    })
    @ApiCreatedResponse({
        description: 'The video playback has started',
        type: PlaybackSessionSchema,
    })
    startPlayback (@CurrentSession.HTTP() session: CachedSession, @CurrentVideo() video: Video) {
        return this.playbackService.playFromVideo(session, video);
    }
}
