import { Episode, Media } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';

export const CurrentMedia = getHTTPCurrentData<{media: Media}>(
    (request) => request.media,
    'Media',
);

export const CurrentEpisode = getHTTPCurrentData<{episode: Episode}>(
    (request) => request.episode,
    'Episode',
);

export const ApiMediaId = (description: string) => ApiParamId('media', description);
