import { AuthKey } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';


export const CurrentAuthKey = getHTTPCurrentData<{authKey: AuthKey}>(
    (request) => request.authKey,
    'Auth key',
);
