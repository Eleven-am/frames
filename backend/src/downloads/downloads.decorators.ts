import { Download } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';

export const CurrentDownload = getHTTPCurrentData<{download: Download}>(
    (request) => request.download,
    'Download',
);
