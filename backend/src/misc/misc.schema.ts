import { MediaEmbeds, Subtitle } from '@prisma/client';

import { MediaPartialDetails } from '../media/media.contracts';

export type MakeEmbeddable<PrismaTable, column extends string> = PrismaTable & {
    [key in column]: number[];
};

export type MediaEmbeddable = MakeEmbeddable<MediaEmbeds, 'vector'>;

export interface MediaMetadata
    extends Omit<MediaPartialDetails, 'genre' | 'rating'> {
    name: string;
    genres: string[];
    actors: string[];
    directors: string[];
    voteAverage: number;
    tmdbId: number;
}

export type FramesSubtitle = Omit<
    Subtitle,
    'id' | 'videoId' | 'created' | 'updated' | 'subtitles'
>;

export class OpenAIKeyEvent {
    constructor (public openAIKey: string) {}
}

export class TmDBKeyEvent {
    constructor (public tmdbKey: string) {}
}

export class NodemailerConfigEvent {
    constructor (
        public config: {
            host: string;
            port: number;
            secure: boolean;
            auth: {
                user: string;
                pass: string;
            };
        },
        public domain: string,
    ) {}
}

export class OpenSubtitlesKeyEvent {
    constructor (
        public username: string,
        public password: string,
        public userAgent: string,
    ) {}
}
