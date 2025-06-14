import { Action, CanPerform } from '@eleven-am/authorizer';
import { Controller, Get, Header, Headers, Param, Res, UseGuards } from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiPartialContentResponse,
    ApiProduces,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { HLSService } from './hls.service';
import {
    AudioOptionWithSegment,
    AudiOptions,
    HLSSubtitleInfoSchema,
    VideoOptions,
    VideoOptionWithSegment,
} from './stream.contracts';
import {
    ApiAudioStreamQuality,
    ApiStreamIndex,
    ApiVideoStreamQuality,
} from './stream.decorators';
import { StreamGuard } from './stream.guard';
import { ArtworkSchema } from './stream.schema';
import { StreamService } from './stream.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import {
    ApiPlaybackId,
    CurrentPlayback,
} from '../playback/playback.decorators';
import { Playback } from '../playback/playback.schema';
import { CachedSession } from '../session/session.contracts';
import { SubtitleInfoSchema } from '../subtitles/subtitles.contracts';

@ApiTags('Stream')
@Controller('stream')
export class StreamController {
    constructor (
        private readonly hlsService: HLSService,
        private readonly streamService: StreamService,
    ) {}

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
    @UseGuards(StreamGuard)
    streamVideo (
        @CurrentPlayback() playback: Playback,
        @Headers('Range') range: string,
        @Res() res: Response,
    ) {
        return this.streamService.streamVideo(playback, res, range);
    }

    @Get('thumbnail/:playbackId')
    @CanPerform({
        action: Action.Read,
        resource: 'View',
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

    @Get(':playbackId/master.m3u8')
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
    @Header('Content-Type', 'application/vnd.apple.mpegurl')
    @UseGuards(StreamGuard)
    getMasterPlaylist (
        @CurrentPlayback() playback: Playback,
        @CurrentSession.HTTP() session: CachedSession,
    ) {
        return this.hlsService.getMasterRendition(playback, session);
    }

    @Get(':playbackId/subtitles')
    @ApiPlaybackId('to be retrieved')
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Retrieve a subtitle',
        description: 'Retrieve all subtitles from the video',
    })
    @ApiOkResponse({
        description: 'The subtitles have been retrieved',
        type: [HLSSubtitleInfoSchema],
    })
    getSubtitles (@CurrentPlayback() playback: Playback) {
        return this.hlsService.retrieveConvertibleSubtitles(playback);
    }

    @Get(':playbackId/subtitles/:streamIndex.vtt')
    @ApiPlaybackId('to be retrieved')
    @ApiStreamIndex()
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Retrieve a subtitle',
        description: 'Retrieve a cue of subtitles from the video',
    })
    @ApiOkResponse({
        description: 'The subtitle has been retrieved',
        type: SubtitleInfoSchema,
    })
    getSubtitle (
        @CurrentPlayback() playback: Playback,
        @Param('streamIndex') streamIndex: string,
    ) {
        return this.hlsService.retrieveVTTSubtitle(playback, parseInt(streamIndex, 10));
    }

    @Get(':playbackId/video/:streamIndex/:quality/playlist.m3u8')
    @ApiPlaybackId('to create the playlist for')
    @ApiStreamIndex()
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Creates the single video quality playlist',
        description: 'Creates the single video quality playlist for the video',
    })
    @ApiOkResponse({
        description: 'The playlist has been created',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiVideoStreamQuality()
    @ApiProduces('application/vnd.apple.mpegurl')
    @Header('Content-Type', 'application/vnd.apple.mpegurl')
    @UseGuards(StreamGuard)
    getVideoRendition (
        @CurrentSession.HTTP() session: CachedSession,
        @CurrentPlayback() playback: Playback,
        @Param() params: VideoOptions,
    ) {
        return this.hlsService.getVideoRenditionPlaylist(playback, session, params);
    }

    @Get(':playbackId/audio/:streamIndex/:quality/playlist.m3u8')
    @ApiPlaybackId('to create the playlist for')
    @ApiStreamIndex()
    @CanPerform({
        action: Action.Read,
        resource: 'View',
    })
    @ApiOperation({
        summary: 'Creates the single audio quality playlist',
        description: 'Creates the single audio quality playlist for the video',
    })
    @ApiOkResponse({
        description: 'The playlist has been created',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiAudioStreamQuality()
    @ApiProduces('application/vnd.apple.mpegurl')
    @Header('Content-Type', 'application/vnd.apple.mpegurl')
    @UseGuards(StreamGuard)
    getAudioRendition (
        @CurrentSession.HTTP() session: CachedSession,
        @CurrentPlayback() playback: Playback,
        @Param() params: AudiOptions,
    ) {
        return this.hlsService.getAudioRenditionPlaylist(playback, session, params);
    }

    @Get(':playbackId/video/:streamIndex/:quality/segment-:segment.ts')
    @ApiPlaybackId('to be streamed')
    @ApiStreamIndex()
    @CanPerform({
        action: Action.Read,
        resource: 'View',
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
    @ApiVideoStreamQuality()
    @ApiProduces('video/mp2t')
    @UseGuards(StreamGuard)
    getVideoSegment (
        @CurrentPlayback() playback: Playback,
        @CurrentSession.HTTP() session: CachedSession,
        @Param() params: VideoOptionWithSegment,
    ) {
        return this.hlsService.getVideoSegmentStream(
            playback,
            session,
            params,
        );
    }

    @Get(':playbackId/audio/:streamIndex/:quality/segment-:segment.ts')
    @ApiPlaybackId('to be streamed')
    @ApiStreamIndex()
    @CanPerform({
        action: Action.Read,
        resource: 'View',
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
    @ApiAudioStreamQuality()
    @ApiProduces('video/mp2t')
    @UseGuards(StreamGuard)
    getAudioSegment (
        @CurrentPlayback() playback: Playback,
        @CurrentSession.HTTP() session: CachedSession,
        @Param() params: AudioOptionWithSegment,
    ) {
        return this.hlsService.getAudioSegmentStream(
            playback,
            session,
            params,
        );
    }
}
