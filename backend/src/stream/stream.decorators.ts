import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { StreamItem } from './stream.schema';
import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';


export const CurrentStream = getHTTPCurrentData<{stream: StreamItem}>(
    (request) => request.stream,
    'StreamItem',
);

export const ApiStreamId = (description: string) => ApiParamId('stream', description);

export function ApiStreamQuality (description: string) {
    return applyDecorators(
        ApiStreamId(description),
        ApiParam({
            description: 'The segment quality',
            enumName: 'quality',
            name: 'quality',
            'enum': ['1080p', '720p', '480p'],
        }),
    );
}
