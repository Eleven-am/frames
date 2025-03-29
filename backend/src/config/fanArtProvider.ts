import { Provider } from '@nestjs/common';

import { FAN_ART_API_KEY_SYMBOL } from './constants';
import { RetrieveService } from '../misc/retrieve.service';


export const FanArtAPIKeyProvider: Provider = {
    provide: FAN_ART_API_KEY_SYMBOL,
    inject: [RetrieveService],
    useFactory: (retrieveService: RetrieveService) => retrieveService.fanArtApiKey.toPromise(),
};
