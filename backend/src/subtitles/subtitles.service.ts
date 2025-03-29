import { TaskEither, Either, createNotFoundError } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Subtitle } from '@prisma/client';
import { parseSync } from 'subtitle';

import { NodeCueData, SubtitleInfo } from './subtitles.contracts';
import { HttpService } from '../http/http.service';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class SubtitlesService {
    constructor (
        private readonly httpService: HttpService,
        private readonly prismaService: PrismaService,
    ) {}

    getSubtitles (subtitle: Subtitle) {
        return this.getNodesFromSubtitles(subtitle)
            .map((nodes): SubtitleInfo => ({
                nodes,
                id: subtitle.id,
                offset: subtitle.offset,
                subtitleUrl: subtitle.url,
                label: subtitle.languageName,
                srcLang: subtitle.languageCode,
            }));
    }

    updateOffset (subtitle: Subtitle, offset: number) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.subtitle.update({
                    where: {
                        id: subtitle.id,
                    },
                    data: {
                        offset,
                    },
                }),
                'Failed to update offset',
            )
            .chain((subtitle) => this.getNodesFromSubtitles(subtitle));
    }

    private saveNodes (subtitle: Subtitle, nodes: NodeCueData[]) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.subtitle.update({
                    where: {
                        id: subtitle.id,
                    },
                    data: {
                        subtitles: nodes.map((node) => ({
                            start: node.start,
                            end: node.end,
                            text: node.text,
                        })),
                    },
                }),
                'Failed to save subtitles',
            )
            .map(() => nodes);
    }

    private getNodesFromSubtitles (subtitle: Subtitle) {
        const getNodes = (subtitle: Subtitle) => this.fetchNodes(subtitle.url)
            .chain((nodes) => this.saveNodes(subtitle, nodes));

        return TaskEither
            .fromNullable(subtitle.subtitles)
            .map((subtitles) => subtitles as unknown as NodeCueData[])
            .orElse(() => getNodes(subtitle));
    }

    private fetchNodes (url: string) {
        return this.httpService.apiGet<string>(url)
            .chain((data) => Either
                .tryCatch(
                    () => parseSync(data),
                    'Failed to parse subtitles',
                )
                .filter(
                    (items) => items.length > 1,
                    () => createNotFoundError('No subtitles found'),
                )
                .filterItems((item) => item.type === 'cue')
                .mapItems((item) => item.data as NodeCueData)
                .toTaskEither());
    }
}
