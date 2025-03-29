import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { Playback, PlaybackVideo } from './playback.schema';
import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';


export const CurrentPlayback = getHTTPCurrentData<{playback: Playback}>(
    (request) => request.playback,
    'Playback',
);

export const CurrentVideo = getHTTPCurrentData<{video: PlaybackVideo}>(
    (request) => request.video,
    'Video',
);

export const Range = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request: Request = context.switchToHttp().getRequest();

        return request.headers.range ?? '';
    },
);

export const ApiPlaybackId = (description: string) => ApiParamId('playback', description);
