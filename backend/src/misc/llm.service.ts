import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {Media, MediaEmbeds, Prisma} from '@prisma/client';
import { Document } from 'langchain/document';

import { OPEN_AI_KEY_UPDATED_EVENT } from './misc.constants';
import { MediaEmbeddable, MediaMetadata, OpenAIKeyEvent } from './misc.schema';
import { OPEN_AI_API_KEY_SYMBOL } from '../config/constants';
import { PrismaService } from '../prisma/prisma.service';
import { ScanResult } from '../scanner/scanner.contracts';
import { firstLetterUpperCase } from '../utils/helper.fp';


@Injectable()
export class LLMService {
    private readonly logger = new Logger(LLMService.name);

    private prisma: PrismaVectorStore<MediaEmbeds, 'MediaEmbeds', any, any>;

    constructor (
        private readonly db: PrismaService,
        @Inject(OPEN_AI_API_KEY_SYMBOL) private readonly openAIApiKey: string,
    ) {
        try {
            this.prisma = LLMService.generateMediaVectorStore(db, this.openAIApiKey);
        } catch (error) {
            this.logger.error('Error generating media vector store', error);
        }
    }

    static generateMediaVectorStore (db: PrismaService, openAIApiKey: string): PrismaVectorStore<MediaEmbeds, 'MediaEmbeds', any, any> {
        return PrismaVectorStore.withModel<MediaEmbeds>(db)
            .create(
                new OpenAIEmbeddings({
                    openAIApiKey,
                }),
                {
                    prisma: Prisma,
                    tableName: 'MediaEmbeds',
                    vectorColumnName: 'vector',
                    columns: {
                        id: PrismaVectorStore.IdColumn,
                        mediaId: true,
                        metadata: PrismaVectorStore.ContentColumn,
                    },
                },
            );
    }

    saveMediaEmbed (media: ScanResult, mediaId: string) {
        const mediaMetadata: MediaMetadata = {
            name: media.name,
            genres: media.genres,
            actors: media.actors,
            overview: media.overview,
            directors: media.directors,
            voteAverage: media.voteAverage,
            popularity: media.popularity,
            releaseDate: media.releaseDate,
            trailer: media.trailer,
            tmdbId: media.tmdbId,
        };

        const embeddableMediaMetadata = Object.entries(mediaMetadata)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `*${firstLetterUpperCase(key)}* ${value}\n`)
            .join('');

        const addDocumentsTryCatch = (
            document: Document<{ id: string, mediaId: string, metadata: string }>,
        ) => TaskEither.tryCatch(
            () => this.prisma.addDocuments([document]),
            'Error adding media embeddings to vector store',
        );

        return TaskEither
            .tryCatch(
                () => this.db.mediaEmbeds.create({
                    data: {
                        mediaId,
                        metadata: embeddableMediaMetadata,
                    },
                }),
                'Error saving media embeddings',
            )
            .map((embed) => new Document({
                pageContent: embed.metadata,
                metadata: {
                    id: embed.id,
                    mediaId: embed.mediaId,
                    metadata: embed.metadata,
                },
            }))
            .chain(addDocumentsTryCatch)
            .map(() => mediaId);
    }

    searchForMostSimilarMedia (query: string, limit: number, ability: AppAbilityType) {
        return TaskEither.tryCatch(
            () => this.prisma.similaritySearch(query, limit),
            'Error searching for most similar media',
        )
            .map((documents) => documents.map((document) => document.metadata.mediaId))
            .chain((mediaIds) => TaskEither.tryCatch(
                () => this.db.media.findMany({
                    where: {
                        AND: [
                            {
                                id: {
                                    'in': mediaIds,
                                },
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                }),
                'Error getting media from similar media ids',
            ))
            .orElse(() => TaskEither.of([]))
    }

    generateMediaRecommendations (mediaId: string, ability: AppAbilityType, amount = 20) {
       return this.getEmbeddings(mediaId).chain(({ vector }) =>
          TaskEither.of(vector).matchTask<Media[]>([
            {
              predicate: (vector) => vector.length > 0,
              run: (vector) =>
                TaskEither.tryCatch(
                  () =>
                    this.prisma.similaritySearchVectorWithScore(
                      vector,
                      amount + 1,
                    ),
                  'Error getting closest embeddings',
                )
                  .map((data) =>
                    data.map(([vector, score]) => ({
                      score,
                      mediaId: vector.metadata.mediaId,
                    })),
                  )
                  .chain((mappedData) =>
                    TaskEither.tryCatch(
                      () =>
                        this.db.media.findMany({
                          where: {
                            AND: [
                              {
                                id: {
                                  in: mappedData
                                    .filter((data) => data.mediaId !== mediaId)
                                    .map((data) => data.mediaId),
                                },
                              },
                              accessibleBy(ability, Action.Read).Media,
                            ],
                          },
                        }),
                      'Error getting media recommendations',
                    ).intersect(mappedData, 'id', 'mediaId', ['score']),
                  )
                  .sortBy('score', 'asc'),
            },
            {
              predicate: () => true,
              run: () =>
                TaskEither.tryCatch(() =>
                  this.db.media.random({
                    length: amount,
                    where: {
                      AND: [
                        {
                          id: {
                            not: mediaId,
                          },
                        },
                        accessibleBy(ability, Action.Read).Media,
                      ],
                    },
                  }),
                ),
            },
          ])
           .map((media) => ({
               recommended: vector.length > 0,
                media,
           }))
        );
    }

    @OnEvent(OPEN_AI_KEY_UPDATED_EVENT)
    openAIKeyUpdated (event: OpenAIKeyEvent) {
        try {
            this.prisma = LLMService.generateMediaVectorStore(this.db, event.openAIKey);
        } catch (error) {
            this.logger.error('Error updating openAI key', error);
        }
    }

    private getEmbeddings (mediaId: string) {
        const query = Prisma.sql`
        SELECT "id", "mediaId", "metadata", CAST("vector" AS float4[]) AS "vector"
        FROM "MediaEmbeds"
        WHERE "mediaId" = ${mediaId}
        LIMIT 1
    `;

        return TaskEither
            .tryCatch(
                () => this.db.$queryRaw<MediaEmbeddable[]>(query),
                'Error getting media embeddings',
            )
            .map((items) => items[0])
            .nonNullable('No embeddings found for media id')
            .chain((embed) => TaskEither.tryCatch(
                () => this.db.media.findUnique({ where: { id: embed.mediaId } }),
                'Error getting media embeddings',
            )
                .nonNullable('No media found for media id')
                .map((media) => ({
                    ...embed,
                    media,
                })))
    }
}
