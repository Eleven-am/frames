import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither, createInternalError } from '@eleven-am/fp';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MediaEmbeds, Prisma } from '@prisma/client';
import { Document } from 'langchain/document';

import { OPEN_AI_KEY_UPDATED_EVENT } from './misc.constants';
import { MediaEmbeddable, MediaEmbedData, MediaMetadata, OpenAIKeyEvent } from './misc.schema';
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
            ));
    }

    generateMediaRecommendations (mediaId: string, ability: AppAbilityType, amount = 20) {
        const closestTryCatch = (vector: number[]) => TaskEither.tryCatch(
            () => this.prisma.similaritySearchVectorWithScore(vector, amount + 1),
            'Error getting closest embeddings',
        );

        const getMediaMetadataFromEmbed = (embed: string, tmdbId: number) => {
            const metadata = embed
                .split('\n')
                .map((line) => line.split('*'))
                .filter((line) => line.length === 3)
                .map(([_, key, value]) => [
                    key.toLowerCase().trim(),
                    value.trim(),
                ]);

            const metaData = Object.fromEntries(metadata);

            const actors = metaData.actors
                ?.split(',')
                .map((actor: string) => actor.trim())
                .map((actor: string) => {
                    const [name, character] = actor.split(' as ');

                    return {
                        name,
                        character,
                    };
                });

            const directors = metaData.directors
                ?.split(',')
                .map((director: string) => director.trim());

            const genres = metaData.genres
                ?.split(',')
                .map((genre: string) => genre.trim());

            const releaseDate = new Date(metaData.releasedate);

            const voteAverage = parseFloat(metaData.voteaverage);

            const popularity = parseFloat(metaData.popularity);

            const mediaMetadata: MediaEmbedData = {
                name: metaData.name,
                overview: metaData.overview,
                trailer: metaData.trailer,
                actors,
                directors,
                genres,
                releaseDate,
                voteAverage,
                popularity,
                tmdbId,
            };

            return mediaMetadata;
        };

        return this.getEmbeddings(mediaId)
            .chain((mediaEmbed) => closestTryCatch(mediaEmbed.vector)
                .map((data) => data.map(([vector, score]) => ({
                    score,
                    pageContent: vector.pageContent,
                    embeddedId: vector.metadata.id,
                    mediaId: vector.metadata.mediaId,
                    metadata: getMediaMetadataFromEmbed(
                        vector.metadata.metadata,
                        mediaEmbed.media.tmdbId,
                    ),
                }))))
            .chain((mappedData) => TaskEither
                .of(mappedData)
                .mapItems((data) => data.mediaId)
                .filterItems((id) => id !== mediaId)
                .chain((mediaIds) => TaskEither
                    .tryCatch(
                        () => this.db.media.findMany({
                            where: {
                                AND: [
                                    {
                                        id: {
                                            'in': mediaIds,
                                        },
                                    },
                                    {
                                        ...accessibleBy(ability, Action.Read).Media,
                                    },
                                ],
                            },
                        }),
                        'Error getting media recommendations',
                    ))
                .intersect(mappedData, 'id', 'mediaId', [
                    'score',
                    'pageContent',
                    'embeddedId',
                    'metadata',
                ]))
            .sortBy('score', 'asc');
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
            .filter(
                (embed) => Boolean(embed.vector) && embed.vector.length > 0,
                () => createInternalError('No embeddings found for media id'),
            );
    }
}
