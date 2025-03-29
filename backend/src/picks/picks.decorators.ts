import { PickCategory } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';

export const CurrentPickCategory = getHTTPCurrentData<{pickCategory: PickCategory}>(
    (request) => request.pickCategory,
    'PickCategory',
);

export const ApiPickCategoryId = (description: string) =>  ApiParamId('category', description);
