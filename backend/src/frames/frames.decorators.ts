import { Frame } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';

export const CurrentFrame = getHTTPCurrentData<{frame: Frame}>(
    (request) => request.frame,
    'Frame',
);
