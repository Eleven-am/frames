import { Action, AppAbilityType, CanPerform, CurrentAbility } from '@eleven-am/authorizer';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Media, Playlist, PlaylistVideo } from '@prisma/client';

import {
    CreatePlaylistArgs,
    PageResponsePlaylistSchema,
    PlaylistDetailsSchema,
    PlaylistForMediaContextSchema,
    SharePlaylistArgs,
    UpdatePlaylistArgs,
} from './playlists.contracts';
import { ApiPlaylistId, CurrentPlaylist, CurrentPlaylistVideo } from './playlists.decorators';
import { PlaylistsService } from './playlists.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { PlaybackSessionSchema } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { PaginateArgs } from '../utils/utils.contracts';
import { ApiOkFramesResponse, ApiParamId } from '../utils/utils.decorators';


@Controller('playlists')
@ApiTags('Playlists')
export class PlaylistsController {
    constructor (private readonly playlistsService: PlaylistsService) {}

    @Post()
    @CanPerform({
        action: Action.Create,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Create a new playlist',
        description:
      'Create a new playlist with the given details and return the new playlist object',
    })
    @ApiCreatedResponse({
        description: 'The playlist has been successfully created',
        type: PlaylistDetailsSchema,
    })
    createPlaylist (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @Body() args: CreatePlaylistArgs) {
        return this.playlistsService.createPlaylist(session.user, args, ability);
    }

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Get all playlists',
        description: 'Get all playlists the current user has access to',
    })
    @ApiOkResponse({
        description: 'The playlists have been successfully fetched',
        type: PageResponsePlaylistSchema,
    })
    getPlaylists (@CurrentSession.HTTP() session: CachedSession, @Query() paginated: PaginateArgs) {
        return this.playlistsService.getPlaylists(session.user, paginated);
    }

    @Get('count')
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Get all playlists count',
        description: 'Get the count of all playlists the current user has created',
    })
    @ApiOkResponse({
        description: 'The playlists count have been successfully fetched',
        schema: {
            type: 'object',
            properties: {
                count: {
                    type: 'number',
                },
            },
            required: ['count'],
        },
    })
    getPlaylistsCount (@CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.getPlaylistsCount(session.user);
    }

    @Get('public')
    @ApiOperation({
        summary: 'Get public playlists',
        description: 'Get all public playlists',
    })
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOkResponse({
        description: 'The public playlists have been successfully fetched',
        type: PageResponsePlaylistSchema,
    })
    getPublicPlaylists (@Query() paginated: PaginateArgs, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.getPublicPlaylists(session.user, paginated);
    }

    @Patch(':playlistId')
    @ApiPlaylistId('to be updated')
    @CanPerform({
        action: Action.Update,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Update a playlist',
        description: 'Update details of a playlist with the given Id',
    })
    @ApiOkResponse({
        description: 'The playlist has been successfully updated',
        type: PlaylistDetailsSchema,
    })
    updatePlaylist (@Body() args: UpdatePlaylistArgs, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession, @CurrentPlaylist() playlist: Playlist) {
        return this.playlistsService.updatePlaylist(session.user, playlist, args, ability);
    }

    @Get(':playlistId')
    @ApiPlaylistId('to be fetched')
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Get a playlist',
        description: 'Get details of a playlist with the given Id',
    })
    @ApiOkResponse({
        description: 'The playlist has been successfully fetched',
        type: PlaylistDetailsSchema,
    })
    getPlaylist (@CurrentPlaylist() playlist: Playlist, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.getPlaylist(playlist, session.user, ability);
    }

    @Delete(':playlistId')
    @ApiPlaylistId('to be deleted')
    @CanPerform({
        action: Action.Delete,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Delete a playlist',
        description: 'Delete a playlist with the given Id',
    })
    @ApiOkFramesResponse('The playlist was deleted successfully')
    deletePlaylist (@CurrentPlaylist() playlist: Playlist) {
        return this.playlistsService.deletePlaylist(playlist);
    }

    @Get('media/:mediaId')
    @ApiMediaId('to be fetch playlists for')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get playlists for media',
        description: 'Get all playlists that contain the given media',
    })
    @ApiOkResponse({
        description: 'The playlists have been successfully fetched',
        type: [PlaylistForMediaContextSchema],
    })
    @ApiQuery({
        type: String,
        name: 'videoId',
        required: false,
        description: 'Check the playlists for the given videoId',
    })
    getPlaylistsForMedia (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession, @Query('videoId') videoId?: string) {
        return this.playlistsService.getPlaylistsForMedia(media, session.user, videoId);
    }

    @Patch('media/:playlistId/:mediaId')
    @ApiMediaId('to be added to the playlist')
    @ApiPlaylistId('to add the media to')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Playlist',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Add media to playlist',
        description: 'Add the given media to the given playlist',
    })
    @ApiOkResponse({
        description: 'The playlist has been successfully updated',
        type: PlaylistDetailsSchema,
    })
    addMediaToPlaylist (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentPlaylist() playlist: Playlist, @CurrentMedia() media: Media) {
        return this.playlistsService.addMediaToPlaylist(session.user, media, playlist, ability);
    }

    @Delete('media/:playlistId/:mediaId')
    @ApiMediaId('to be removed from the playlist')
    @ApiPlaylistId('to remove the media from')
    @CanPerform({
        action: Action.Update,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Remove media from playlist',
        description: 'Remove the given media from the given playlist',
    })
    @ApiOkResponse({
        description: 'The playlist has been successfully updated',
        type: PlaylistDetailsSchema,
    })
    removeMediaFromPlaylist (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentPlaylist() playlist: Playlist, @CurrentMedia() media: Media) {
        return this.playlistsService.removeMediaFromPlaylist(session.user, media, playlist, ability);
    }

    @Patch('share/:playlistId')
    @ApiPlaylistId('to be shared')
    @CanPerform({
        action: Action.Update,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Share a playlist',
        description: 'Share a playlist with the given email addresses',
    })
    @ApiOkFramesResponse('The playlist has been successfully shared')
    sharePlaylist (@CurrentPlaylist() playlist: Playlist, @Body() params: SharePlaylistArgs) {
        return this.playlistsService.sharePlaylist(params, playlist);
    }

    @Delete('share/:playlistId')
    @ApiPlaylistId('to be unshared')
    @CanPerform({
        action: Action.Update,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'UnShare a playlist',
        description: 'UnShare a playlist with the given email addresses',
    })
    @ApiOkFramesResponse('The playlist has been successfully unshared')
    unSharePlaylist (@CurrentPlaylist() playlist: Playlist, @Body() params: SharePlaylistArgs) {
        return this.playlistsService.unSharePlaylist(params, playlist);
    }

    @Get('play/:playlistId')
    @ApiPlaylistId('to be played')
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Play playlist',
        description: 'Play the given playlist and return a playback session',
    })
    @ApiOkResponse({
        description: 'The playlist has been successfully played',
        type: PlaybackSessionSchema,
    })
    playPlaylist (@CurrentPlaylist() playlist: Playlist, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.playFirstPlaylistVideo(session, playlist);
    }

    @Get('play-video/:playlistVideoId')
    @ApiParamId('playlist video', 'to be played')
    @CanPerform({
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Play playlist video',
        description: 'Play the given playlist video and return a playback session',
    })
    @ApiOkResponse({
        description: 'The playlist video has been successfully played',
        type: PlaybackSessionSchema,
    })
    playPlaylistVideo (@CurrentSession.HTTP() session: CachedSession, @CurrentPlaylistVideo() playlistVideo: PlaylistVideo) {
        return this.playlistsService.playPlaylistVideo(session, playlistVideo);
    }

    @Get('shuffle/media/:mediaId')
    @ApiMediaId('to be shuffled')
    @CanPerform(
        {
            action: Action.Read,
            resource: 'Media',
        },
        {
            action: Action.Create,
            resource: 'Playlist',
        },
    )
    @ApiOperation({
        summary: 'Shuffle media',
        description:
      'Shuffle the given media and return a new playback session of the first video in the playlist',
    })
    @ApiOkResponse({
        description: 'The shuffled playlist',
        type: PlaybackSessionSchema,
    })
    shuffleMedia (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.shuffleMedia(session, media);
    }

    @Get('shuffle/playlist/:playlistId')
    @ApiPlaylistId('to be shuffled')
    @CanPerform({
        action: Action.Create,
        resource: 'Playlist',
    },
    {
        action: Action.Read,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Shuffle playlist',
        description:
      'Shuffle the given playlist and return a playback session of the first video in the playlist',
    })
    @ApiOkResponse({
        description: 'The shuffled playlist',
        type: PlaybackSessionSchema,
    })
    shufflePlaylist (@CurrentPlaylist() playlist: Playlist, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.shufflePlaylist(session, playlist, ability);
    }

    @Get('shuffle/company/:companyId')
    @ApiParamId('company', 'to be shuffled')
    @CanPerform({
        action: Action.Create,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Shuffle company',
        description:
      'Shuffle the given company and return a playback session of the first video in the playlist',
    })
    @ApiOkResponse({
        description: 'The shuffled playlist',
        type: PlaybackSessionSchema,
    })
    shuffleCompany (@Param('companyId') companyId: string, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.shuffleCompany(session, companyId, ability);
    }

    @Get('shuffle/person/:personId')
    @ApiParamId('person', 'to be shuffled')
    @CanPerform({
        action: Action.Create,
        resource: 'Playlist',
    })
    @ApiOperation({
        summary: 'Shuffle person',
        description:
      'Shuffle the given person and return a playback session of the first video in the playlist',
    })
    @ApiOkResponse({
        description: 'The shuffled playlist',
        type: PlaybackSessionSchema,
    })
    shufflePerson (@Param('personId') personId: string, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.playlistsService.shufflePerson(session, ability, Number(personId));
    }
}
