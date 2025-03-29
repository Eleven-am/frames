import { Subtitle } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';


export const CurrentSubtitle = getHTTPCurrentData<{subtitle: Subtitle}>(
    (request) => request.subtitle,
    'Subtitle',
);

export const ApiSubtitleId = (description: string) => ApiParamId('subtitle', description);
