import { TmDBApi } from '@eleven-am/tmdbapi';
import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TMDB_API_KEY_SYMBOL } from '../config/constants';


import { TMDB_KEY_UPDATED_EVENT } from './misc.constants';
import { TmDBKeyEvent } from './misc.schema';

@Injectable()
export class TmdbService extends TmDBApi {
    constructor (@Inject(TMDB_API_KEY_SYMBOL) tmdbApiKey: string) {
        super(tmdbApiKey, fetch);
    }

    @OnEvent(TMDB_KEY_UPDATED_EVENT)
    private onTmDBKeyUpdated (event: TmDBKeyEvent) {
        this.updateApiKey(event.tmdbKey);
    }
}
