import { Action, CanPerform, AppAbilityType, CurrentAbility } from '@eleven-am/authorizer';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Frame } from '@prisma/client';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CurrentPlayback } from '../playback/playback.decorators';
import { PlaybackSessionSchema, Playback } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { PaginateArgs } from '../utils/utils.contracts';
import { ApiOkFramesResponse } from '../utils/utils.decorators';

import { CreateFrameArgs, FrameCreateSchema, PageResponseFrameSchema } from './frames.contracts';
import { CurrentFrame } from './frames.decorators';
import { FramesService } from './frames.service';


@Controller('frames')
@ApiTags('Frames')
export class FramesController {
    constructor (private readonly framesService: FramesService) {}

    @Post(':playbackId')
    @CanPerform({
        action: Action.Create,
        resource: 'Frame',
    })
    @ApiOperation({
        summary: 'Create a frame',
        description: 'Create a frame with the percentage of the current video',
    })
    @ApiCreatedResponse({
        description: 'The created frame',
        type: FrameCreateSchema,
    })
    createFrame (@CurrentSession.HTTP() session: CachedSession, @CurrentPlayback() playback: Playback, @Body() body: CreateFrameArgs) {
        return this.framesService.createFrame(session.user, playback, body);
    }

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'Frame',
    })
    @ApiOperation({
        summary: 'Get frames',
        description: 'Get a list of frames a user has created',
    })
    @ApiOkResponse({
        description: 'A list of frames',
        type: PageResponseFrameSchema,
    })
    getFrames (@CurrentAbility.HTTP() ability: AppAbilityType, @Query() query: PaginateArgs) {
        return this.framesService.getFrames(ability, query);
    }

    @Delete(':cypher')
    @ApiParam({
        name: 'cypher',
        type: String,
        description: 'The cypher of the frame to delete',
    })
    @CanPerform({
        action: Action.Delete,
        resource: 'Frame',
    })
    @ApiOperation({
        summary: 'Delete a frame',
        description: 'Delete a frame the current user has created',
    })
    @ApiOkFramesResponse('The frame was deleted successfully')
    deleteFrame (@CurrentFrame() cypher: Frame) {
        return this.framesService.deleteFrame(cypher);
    }

    @Get(':cypher')
    @ApiParam({
        name: 'cypher',
        type: String,
        description: 'The cypher of the frame to retrieve',
    })
    @ApiOperation({
        summary: 'Get a frame',
        description: 'Get a frame by its cypher',
    })
    @ApiOkResponse({
        description: 'The frame by its cypher',
        type: PlaybackSessionSchema,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'Frame',
    })
    getFrame (@CurrentSession.HTTP() session: CachedSession, @CurrentFrame() cypher: Frame) {
        return this.framesService.getFrame(session, cypher);
    }
}
