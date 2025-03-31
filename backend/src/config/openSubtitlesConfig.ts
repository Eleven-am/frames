import { Provider } from '@nestjs/common';

import { RetrieveService } from '../misc/retrieve.service';
import { OPEN_SUBTITLES_CONFIG } from '../playback/playback.constants';


export interface OpenSubtitleOptions {
    useragent: string;
    username: string;
    password: string;
    ssl: boolean;
}

export interface VideoSearch {
    season?: number;
    filesize: number;
    filename: string;
    episode?: number;
    imdbid: string | null;
    extension: string[];
}

export interface OpenSubtitles {
    search: (search: VideoSearch) => Promise<Record<string, OpenSubtitlesResult>>;
    login: () => Promise<{userinfo: string, token: string}>;
}

export interface OpenSubtitlesResult {
    url: string;
    langcode: string;
    downloads: number;
    lang: string;
    encoding: string;
    id: string;
    filename: string;
    date: Date;
    score: number;
    fps: number;
    format: string;
    utf8: string;
    vtt: string;
}

export type OpenSubtitlesResultConstructor = new (
    options: OpenSubtitleOptions,
) => OpenSubtitles;

export const OpenSubtitlesConfig: Provider = {
    provide: OPEN_SUBTITLES_CONFIG,
    useFactory: async (retrieveService: RetrieveService): Promise<OpenSubtitleOptions | null> => {
        const data = await retrieveService.openSubtitlesConfig.toNullable();

        if (!data) {
            return null;
        }

        const { userAgent, username, password } = data;

        return {
            useragent: userAgent,
            username,
            password,
            ssl: true,
        };
    },
    inject: [RetrieveService],
};
