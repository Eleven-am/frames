import { CloudStorage } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';

export const CurrentStorage = getHTTPCurrentData<{storage: CloudStorage}>(
    (request) => request.storage,
    'CloudStorage',
);

export const ApiStorageId = (description: string) => ApiParamId('storage', description);

