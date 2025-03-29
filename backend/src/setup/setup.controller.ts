import { Controller, Post, Body, Get, Query, Patch } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags, ApiQuery, ApiCreatedResponse } from '@nestjs/swagger';

import {
    TmdbApiKeyParams,
    FanArtTvApiKeyParams,
    OpenAiApiKeyParams,
    OpenSubtitlesParams,
    MailServerParams,
    AdminAccountParams,
    OauthClientParams,
    ReadFolderArgs,
    S3Params,
    UpdateSetupStorageArgs,
    SetupConfigurationSchema,
} from './setup.contracts';
import { SetupService } from './setup.service';
import { OauthCallbackQuery } from '../authentication/auth.contracts';
import { ServerAddress } from '../authentication/auth.decorator';
import { ReadFolderSchema, SlimStorageSchema } from '../storage/storage.schema';
import { ApiCreatedFramesResponse, ApiOkFramesResponse } from '../utils/utils.decorators';


@ApiTags('Setup')
@Controller('setup')
export class SetupController {
    constructor (private readonly setupService: SetupService) {
    }

    @Post('tmdb')
    @ApiOperation({
        summary: 'Creates a new TMDB configuration',
        description: 'Creates a new TMDB configuration with the given details',
    })
    @ApiCreatedFramesResponse('The TMDB configuration has been successfully created')
    createTmdbConfig (@Body() tmdbConfig: TmdbApiKeyParams) {
        return this.setupService.saveTmdbApiKey(tmdbConfig);
    }

    @Post('fanart')
    @ApiOperation({
        summary: 'Creates a new FanArtTv configuration',
        description: 'Creates a new FanArtTv configuration with the given details',
    })
    @ApiCreatedFramesResponse('The FanArtTv configuration has been successfully created')
    createFanArtTvConfig (@Body() fanArtTvConfig: FanArtTvApiKeyParams) {
        return this.setupService.saveFanArtApiKey(fanArtTvConfig);
    }

    @Post('openAI')
    @ApiOperation({
        summary: 'Creates a new OpenAI configuration',
        description: 'Creates a new OpenAI configuration with the given details',
    })
    @ApiCreatedFramesResponse('The OpenAI configuration has been successfully created')
    createOpenAIConfig (@Body() openAIConfig: OpenAiApiKeyParams) {
        return this.setupService.saveOpenAiApiKey(openAIConfig);
    }

    @Post('subtitles')
    @ApiOperation({
        summary: 'Creates a new OpenSubtitles configuration',
        description: 'Creates a new OpenSubtitles configuration with the given details',
    })
    @ApiCreatedFramesResponse('The OpenSubtitles configuration has been successfully created')
    createOpenSubtitlesConfig (@Body() openSubtitlesConfig: OpenSubtitlesParams) {
        return this.setupService.saveOpenSubtitles(openSubtitlesConfig);
    }

    @Post('mail')
    @ApiOperation({
        summary: 'Creates a new Mail configuration',
        description: 'Creates a new Mail configuration with the given details',
    })
    @ApiCreatedFramesResponse('The Mail configuration has been successfully created')
    createMailConfig (@Body() mailConfig: MailServerParams) {
        return this.setupService.saveMailServer(mailConfig);
    }

    @Post('admin')
    @ApiOperation({
        summary: 'Creates a new Admin configuration',
        description: 'Creates a new Admin configuration with the given details',
    })
    @ApiCreatedFramesResponse('The Admin configuration has been successfully created')
    createAdminConfig (@Body() adminConfig: AdminAccountParams) {
        return this.setupService.saveAdminAccount(adminConfig);
    }

    @Get('trending')
    @ApiOperation({
        summary: 'Get trending backdrops',
        description: 'Get trending backdrops from the TMDB API',
    })
    @ApiOkResponse({
        description: 'The trending backdrops have been successfully fetched',
        type: [String],
    })
    getTrendingBackdrops () {
        return this.setupService.getTrendingBackdrops();
    }

    @Post('oauth')
    @ApiOperation({
        summary: 'Creates a new Oauth configuration',
        description: 'Creates a new Oauth configuration and returns the URL to authenticate',
    })
    @ApiCreatedFramesResponse('The Oauth configuration has been successfully created')
    createOauthConfig (@Body() params: OauthClientParams, @ServerAddress() endpoint: string) {
        return this.setupService.getOauthUrl(params, endpoint);
    }

    @Get('oauth/callback')
    @ApiOperation({
        summary: 'Authenticate with oauth',
        description: 'Authenticate the user with the oauth provider',
    })
    @ApiOkResponse({
        description: 'A html page that posts the data to the parent window',
        type: String,
    })
    getOauthUrlCallback (@ServerAddress() endpoint: string, @Query() query: OauthCallbackQuery) {
        return this.setupService.handleOauthCallback(query.code, query.state, endpoint);
    }

    @Get('explorer')
    @ApiOperation({
        summary: 'Explorer a folder',
        description: 'Get the details of contents in a folder and of the folder itself',
    })
    @ApiOkResponse({
        description: 'The details of the folder',
        type: ReadFolderSchema,
    })
    exploreFolder (@Query() params: ReadFolderArgs) {
        return this.setupService.readFolder(params);
    }

    @Get('local')
    @ApiOperation({
        summary: 'Get the local storage',
        description: 'Get the details of the local storage',
    })
    @ApiOkResponse({
        description: 'The details of the local storage',
        type: SlimStorageSchema,
    })
    @ApiQuery({
        name: 'name',
        description: 'The name of the storage to create if it does not exist',
        required: true,
        type: String,
    })
    getLocalStorage (@Query('name') name: string) {
        return this.setupService.createLocalStorage(name);
    }

    @Get('configuration')
    @ApiOperation({
        summary: 'Get the configuration',
        description: 'Get the configuration details',
    })
    @ApiOkResponse({
        description: 'The configuration details',
        type: SetupConfigurationSchema,
    })
    getConfiguration () {
        return this.setupService.getConfigurationState();
    }

    @Post('s3')
    @ApiOperation({
        summary: 'Creates a new S3 configuration',
        description: 'Creates a new S3 configuration with the given details',
    })
    @ApiCreatedResponse({
        description: 'The S3 configuration has been successfully created',
        type: SlimStorageSchema,
    })
    createS3Storage (@Body() params: S3Params) {
        return this.setupService.createS3Storage(params);
    }

    @Patch('storage')
    @ApiOperation({
        summary: 'Update the storage',
        description: 'Update the storage with the given details',
    })
    @ApiOkFramesResponse('The storage has been successfully updated')
    updateStorage (@Body() params: UpdateSetupStorageArgs) {
        return this.setupService.updateStorage(params);
    }
}
