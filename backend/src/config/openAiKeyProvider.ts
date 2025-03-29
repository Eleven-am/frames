import { Provider } from '@nestjs/common';

import { OPEN_AI_API_KEY_SYMBOL } from './constants';
import { RetrieveService } from '../misc/retrieve.service';

export const OpenAiAPIKeyProvider: Provider = {
    provide: OPEN_AI_API_KEY_SYMBOL,
    inject: [RetrieveService],
    useFactory: (retrieveService: RetrieveService) => retrieveService.openAiApiKey.toPromise(),
};
