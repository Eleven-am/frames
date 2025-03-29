import { CanPerform, Action } from '@eleven-am/authorizer';
import { Controller, Get, Header, Headers, Param, Res } from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiPartialContentResponse,
    ApiProduces,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';


import { ApiStreamQuality, CurrentStream } from './stream.decorators';
import { StreamItem, StreamParams, ArtworkSchema } from './stream.schema';
import { StreamService } from './stream.service';
import { ApiPlaybackId, CurrentPlayback } from '../playback/playback.decorators';
import { Playback } from '../playback/playback.schema';


@Controller('stream')
@ApiTags('Stream')
export class StreamController {
    constructor (private readonly streamService: StreamService) {}

    @Get('thumbnail/:playbackId')
    @CanPerform({
        action: Action.Read,
        resource: 'Stream',
    })
    @ApiOperation({
        summary: 'Get a list of thumbnails',
        description: 'Get a list of thumbnails for the requested stream',
    })
    @ApiOkResponse({
        description: 'The list of thumbnails has been returned',
        type: [ArtworkSchema],
    })
    @ApiPlaybackId('to get the thumbnail for')
    getThumbnails (@CurrentPlayback() playback: Playback) {
        return this.streamService.getThumbnails(playback);
    }

    @Get(':playbackId/playlist.m3u8')
    @ApiPlaybackId('to create the playlist for')
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Creates the multi variant playlist',
        description: 'Creates the multi variant playlist for the video',
    })
    @ApiOkResponse({
        description: 'The playlist has been created',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('application/vnd.apple.mpegurl')
    getMultiVariantPlaylist (@CurrentPlayback() playback: Playback) {
        return this.streamService.getMultiVariantPlaylist(playback);
    }

    @Get(':streamId/:quality/playlist.m3u8')
    @ApiStreamQuality('to create the playlist for')
    @CanPerform({
        action: Action.Read,
        resource: 'Stream',
    })
    @ApiOperation({
        summary: 'Creates the single quality playlist',
        description: 'Creates the single quality playlist for the video',
    })
    @ApiOkResponse({
        description: 'The playlist has been created',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('application/vnd.apple.mpegurl')
    getSingleVariantPlaylist (@CurrentStream() streamItem: StreamItem) {
        return this.streamService.getSingleVariantPlaylist(streamItem);
    }

    @Get(':streamId/:quality/:segment')
    @ApiStreamQuality('to be streamed')
    @ApiParam({
        description: 'The segment file to be streamed',
        name: 'segment',
        type: String,
    })
    @CanPerform({
        action: Action.Read,
        resource: 'Stream',
    })
    @ApiOperation({
        summary: 'Stream a single segment',
        description: 'Stream a single segment of the video',
    })
    @ApiOkResponse({
        description: 'The video has been streamed',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('video/mp2t')
    getSegment (@CurrentStream() streamItem: StreamItem, @Param() params: StreamParams, @Res() res: Response) {
        return this.streamService.getSegment(streamItem, params.segment, params.quality, res);
    }

    @Get(':playbackId')
    @ApiPlaybackId('to be streamed')
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Stream a video',
        description: 'Stream a video using the playback id',
    })
    @ApiPartialContentResponse({
        description: 'The video has been streamed',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('application/octet-stream')
    @Header('Accept-Ranges', 'bytes')
    streamVideo (@CurrentPlayback() playback: Playback, @Headers('Range') range: string, @Res() res: Response) {
        return this.streamService.streamVideo(playback, res, range);
    }
}
