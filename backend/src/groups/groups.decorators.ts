import { getHTTPCurrentData } from '../utils/helper.fp';

export const CurrentGroup = getHTTPCurrentData<{group: unknown}>(
    (request) => request.group,
    'Group',
);
