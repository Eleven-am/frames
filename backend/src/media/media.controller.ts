import { CanPerform, Action, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Episode, Media } from '@prisma/client';

import {
    FilterGenreArgs,
    FilterMediaArgs,
    GetIdFromQueryArgs,
    MediaTypesArgs,
    ResetEpisodesArgs,
    SearchMediaArgs,
    CollectionPageResponseSchema,
    DetailedMediaSchema,
    HomeResponseSlimMediaSchema,
    IdFromQuerySchema,
    LevenshteinMatchSchema,
    MediaResponseSchema,
    NetworkResponseSchema,
    PageResponseSearchedMediaSchema,
    PageResponseSlimMediaSchema,
    PersonResponseSchema,
    SlimMediaSchema,
} from './media.contracts';
import { ApiMediaId, CurrentEpisode, CurrentMedia } from './media.decorators';
import { MediaService } from './media.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { PlaybackSessionSchema } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { ApiParamId } from '../utils/utils.decorators';


@Controller('media')
@ApiTags('Media')
export class MediaController {
    constructor (private readonly mediaService: MediaService) {}

    @Get('trending')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get trending media',
        description: 'Get the trending media for the home screen',
    })
    @ApiOkResponse({
        description: 'The trending media for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getTrendingHomeScreen (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getTrendingHomeScreen(ability, session.language);
    }

    @Get('popular')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get popular media',
        description: 'Get the popular media for the home screen',
    })
    @ApiOkResponse({
        description: 'The popular media for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getPopularHomeScreen (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getPopularHomeScreen(session.language, ability);
    }

    @Get('top-rated')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get top rated media',
        description: 'Get the top rated media for the home screen',
    })
    @ApiOkResponse({
        description: 'The top rated media for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getTopRatedHomeScreen (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getTopRatedHomeScreen(session.language, ability);
    }

    @Get('airing-today')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get media airing today',
        description: 'Get the media airing today for the home screen',
    })
    @ApiOkResponse({
        description: 'The media airing today for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getAiringTodayHomeScreen (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getAiringTodayHomeScreen(session.language, ability);
    }

    @Get('now-playing')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get media now playing',
        description: 'Get the media now playing for the home screen',
    })
    @ApiOkResponse({
        description: 'The media now playing for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getNowPlayingHomeScreen (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getNowPlayingHomeScreen(session.language, ability);
    }

    @Get('search')
    @ApiOperation({
        summary: 'Search media',
        description:
      'Search for media by title, cast or crew members or even vectors',
    })
    @CanPerform({
        action: Action.Read,
        resource: 'Media',

    })
    @ApiOkResponse({
        description: 'The media items that match the search query',
        type: PageResponseSlimMediaSchema,
    })
    searchMedia (@Query() query: SearchMediaArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.searchMedia(query, ability);
    }

    @Get('fuzzy-search')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Fuzzy search media',
        description: 'Fuzzy search for media by title',
    })
    @ApiOkResponse({
        description: 'The media items that match the search query',
        type: [LevenshteinMatchSchema],
    })
    fuzzySearch (@Query('query') query: string) {
        return this.mediaService.fuzzySearch(query);
    }

    @Get('idFromQuery')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get id from query',
        description: 'Return the id of the media item that matches the query',
    })
    @ApiOkResponse({
        description: 'The id of the media item that matches the query',
        type: IdFromQuerySchema,
    })
    getIdFromQuery (@Query() query: GetIdFromQueryArgs) {
        return this.mediaService.getIdFromQuery(query);
    }

    @Post('genres')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get media genres',
        description: 'Get the genres of media items',
    })
    @ApiOkResponse({
        description: 'The genres of media items',
        schema: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
    })
    filterGenres (@Body() body: FilterGenreArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.filterGenres(body, ability);
    }

    @Post('filter')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Filter media',
        description: 'Filter media by type, genre and decade',
    })
    @ApiOkResponse({
        description: 'The media items that match the filter',
        type: PageResponseSlimMediaSchema,
    })
    filterMedia (@Body() body: FilterMediaArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.filterMedia(body, ability);
    }

    @Get('recommended')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get recommended media',
        description: 'Get the recommended media for the home screen',
    })
    @ApiOkResponse({
        description: 'The recommended media for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getRecommendedHomeScreen (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getRecommendedHomeScreen(ability);
    }

    @Get('company/:companyId')
    @ApiParamId('company', 'to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get company',
        description: 'Get the company by id',
    })
    @ApiOkResponse({
        description: 'The company by id',
        type: NetworkResponseSchema,
    })
    getCompanyById (@Param('companyId') companyId: string, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getCompanyById(companyId, ability);
    }

    @Get('person/:personId')
    @ApiParamId('person', 'to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get person',
        description: 'Get the person by id',
    })
    @ApiOkResponse({
        description: 'The person by id',
        type: PersonResponseSchema,
    })
    getPersonById (@Param('personId') personId: string, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.mediaService.getPersonById(Number(personId), ability, session.language);
    }

    @Get('collection/:collectionId')
    @ApiParamId('collection', 'to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get collection',
        description: 'Get the collection by id',
    })
    @ApiOkResponse({
        description: 'The collection by id',
        type: CollectionPageResponseSchema,
    })
    getCollectionById (@Param('collectionId') collectionId: string, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.mediaService.getCollectionById(Number(collectionId), session.language, ability);
    }

    @Get('trending-banner')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get trending banner',
        description: 'Get the trending banner for the home screen',
    })
    @ApiOkResponse({
        description: 'The trending banner for the home screen',
        type: [DetailedMediaSchema],
    })
    getTrendingBanner (@CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getTrendingBanner(ability, session.language);
    }

    @Get('videos')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get media videos',
        description: 'Get the videos of media items',
    })
    @ApiOkResponse({
        description: 'The videos of media items',
        type: PageResponseSearchedMediaSchema,
    })
    searchMediaWithVideos (@Query() query: SearchMediaArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.searchMediaWithVideos(query, ability);
    }

    @Get('decades')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get media decades',
        description: 'Get the decades of media items',
    })
    @ApiOkResponse({
        description: 'The decades of media items',
        schema: {
            type: 'array',
            items: {
                type: 'number',
            },
        },
    })
    getDecades (@Query() args: MediaTypesArgs, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getDecades(args.type, ability);
    }

    @Get('recently-added')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get recently added media',
        description: 'Get the recently added media for the home screen',
    })
    @ApiOkResponse({
        description: 'The recently added media for the home screen',
        type: HomeResponseSlimMediaSchema,
    })
    getRecentlyAddedHomeScreen (@CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getRecentlyAddedHomeScreen(ability);
    }

    @Get('trending/:type')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get trending media by type',
        description: 'Get the trending media for the app by type',
    })
    @ApiOkResponse({
        description: 'The trending media for the app by type',
        type: [SlimMediaSchema],
    })
    getTrendingMediaByType (@Param() params: MediaTypesArgs, @CurrentAbility.HTTP() ability: AppAbilityType, @CurrentSession.HTTP() session: CachedSession) {
        return this.mediaService.getTrendingMediaByType(params.type, ability, session.language);
    }

    @Get('trending-open')
    @ApiOperation({
        summary: 'Get trending media',
        description:
      'Get the trending media for display within the app, requires no authentication',
    })
    @ApiOkResponse({
        description: 'The trending media for the app',
        type: [SlimMediaSchema],
    })
    getTrending () {
        return this.mediaService.getTrending();
    }

    @Get(':mediaId')
    @ApiMediaId('to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Get a detailed media object by id',
        description:
      'Get a detailed media object by id in the chosen language of the user',
    })
    @ApiOkResponse({
        description: 'The detailed media object by id',
        type: MediaResponseSchema,
    })
    getMediaById (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.getMediaById(media, session, ability);
    }

    @Get('play/:mediaId')
    @ApiMediaId('to be played')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Play a media item',
        description: 'Play a media item by id',
    })
    @ApiOkResponse({
        description: 'The mia item to be played',
        type: PlaybackSessionSchema,
    })
    playMediaById (@CurrentMedia() media: Media, @CurrentSession.HTTP() session: CachedSession, @CurrentAbility.HTTP() ability: AppAbilityType) {
        return this.mediaService.playMedia(session, media, ability);
    }

    @Get('play-episode/:episodeId')
    @ApiParamId('episode', 'to be played')
    @CanPerform({
        action: Action.Read,
        resource: 'Media',
    })
    @ApiOperation({
        summary: 'Play a media item episode',
        description: 'Play a media item episode by id',
    })
    @ApiOkResponse({
        description: 'The episode playback session object',
        type: PlaybackSessionSchema,
    })
    playMediaEpisodeById (@Query() query: ResetEpisodesArgs, @CurrentEpisode() episode: Episode, @CurrentSession.HTTP() session: CachedSession) {
        return this.mediaService.playEpisode(session, episode, query.reset);
    }
}

