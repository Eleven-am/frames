import { TaskEither } from '@eleven-am/fp';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { OPEN_SUBTITLES_KEY_UPDATED_EVENT } from './misc.constants';
import { FramesSubtitle, OpenSubtitlesKeyEvent } from './misc.schema';
import {
    OpenSubtitleOptions,
    OpenSubtitles,
    OpenSubtitlesResultConstructor,
    VideoSearch,
} from '../config/openSubtitlesConfig';
import { OPEN_SUBTITLES_CONFIG } from '../playback/playback.constants';


// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const OS = require('opensubtitles-api') as OpenSubtitlesResultConstructor;

@Injectable()
export class OpenSubtitlesService {
    private openSubtitles: OpenSubtitles | null;

    constructor (
        @Inject(OPEN_SUBTITLES_CONFIG) options: OpenSubtitleOptions | null,
    ) {
        if (!options) {
            this.openSubtitles = null;
        } else {
            this.openSubtitles = new OS(options);
        }
    }

    search (search: Omit<VideoSearch, 'extension'>) {
        return TaskEither
            .fromNullable(this.openSubtitles)
            .chain((openSubtitles) => TaskEither
                .tryCatch(
                    () => openSubtitles.search({
                        ...search,
                        extension: ['srt', 'vtt'],
                    }),
                    'Failed to search for subtitles',
                ))
            .map((results) => Object.values(results))
            .mapItems((result): FramesSubtitle => ({
                offset: 0,
                url: result.url,
                vtt: result.vtt,
                languageName: result.lang,
                languageCode: result.langcode,
            }))
            .orElse(() => TaskEither.of([]));
    }

    @OnEvent(OPEN_SUBTITLES_KEY_UPDATED_EVENT)
    onOpenSubtitlesUpdate (event: OpenSubtitlesKeyEvent) {
        this.openSubtitles = new OS({
            useragent: event.userAgent,
            username: event.username,
            password: event.password,
            ssl: true,
        });
    }
}
