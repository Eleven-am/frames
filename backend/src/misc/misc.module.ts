import { Module, Global } from '@nestjs/common';
import { OpenAiAPIKeyProvider } from '../config/openAiKeyProvider';
import { OpenSubtitlesConfig } from '../config/openSubtitlesConfig';
import { TmDBProvider } from '../config/tmdbProvider';


import { LLMService } from './llm.service';
import { OpenSubtitlesService } from './openSubtitles.service';
import { PubSubService } from './pubsub.service';
import { RetrieveService } from './retrieve.service';
import { TmdbService } from './tmdb.service';


@Global()
@Module({
    providers: [TmDBProvider, OpenAiAPIKeyProvider, TmdbService, RetrieveService, LLMService, OpenSubtitlesConfig, OpenSubtitlesService, PubSubService],
    exports: [TmDBProvider, RetrieveService, TmdbService, LLMService, OpenSubtitlesService, PubSubService],
})
export class MiscModule {}
