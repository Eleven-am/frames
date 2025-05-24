import { Provider } from '@nestjs/common';

import { TMDB_API_KEY_SYMBOL } from './constants';
import { RetrieveService } from '../misc/retrieve.service';


export const TmDBProvider: Provider = {
    provide: TMDB_API_KEY_SYMBOL,
    inject: [RetrieveService],
    useFactory: (retrieveService: RetrieveService) => retrieveService.tmdbApiKey.toNullable(),
};
