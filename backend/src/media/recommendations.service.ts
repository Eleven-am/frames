import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither, difference, Either, createBadRequestError, dedupeBy } from '@eleven-am/fp';
import { Collection } from '@eleven-am/tmdbapi';
import { Injectable } from '@nestjs/common';
import { MediaType, Media, Video, Episode, Watched } from '@prisma/client';
import { LanguageReturn } from '../language/language.types';
import { LLMService } from '../misc/llm.service';
import { TmdbService } from '../misc/tmdb.service';
import { COMPLETED_VIDEO_POSITION } from '../playback/playback.constants';
import { PrismaService } from '../prisma/prisma.service';
import { HomeResponseTypes } from '../utils/utils.contracts';

import { LIST_VALUE_COUNT, RATING_VALUE_COUNT, SEEN_VALUE_COUNT } from './media.constants';
import { SearchMediaArgs, SlimMedia, TmdbVideoDetails, HomeResponse } from './media.contracts';


interface CreditItem {
    name: string;
    job: string | null;
    character: string | null;
    tmdbId: number;
}

interface CompanyItem {
    companyId: string;
    companyName: string;
}

interface RecItem {
    mediaId: string;
    genres: string[];
    credits: CreditItem[];
    companies: CompanyItem[];
    count: number;
}

type InnerMedia = Media & {
    videos: (Video & { episode: Episode | null })[];
    episodes: (Episode & { video: (Video & { episode: Episode | null }) })[];
    watched: (Watched & { video: Video & { episode: Episode | null } })[];
}

@Injectable()
export class RecommendationsService {
    constructor (
        private readonly tmdb: TmdbService,
        private readonly llmService: LLMService,
        private readonly prismaService: PrismaService,
    ) {}

    /**
   * @description Strip down a media to a slim media
   * @param media - The media to slim down
   */
    toSlimMedia (media: Media): SlimMedia {
        return {
            id: media.id,
            name: media.name,
            type: media.type,
            poster: media.poster,
            posterBlur: media.posterBlur,
            backdrop: media.backdrop,
            backdropBlur: media.backdropBlur,
            logo: media.logo,
            logoBlur: media.logoBlur,
            tmdbId: media.tmdbId,
            portrait: media.portrait,
            portraitBlur: media.portraitBlur,
        };
    }

    /**
   * @description Get media recommendations
   * @param mediaId - The media id
   * @param tmdbId - The tmdb id
   * @param ability - The user's ability
   * @param collection - The collection of current media, if any
   */
    getMediaRecommendations (mediaId: string, tmdbId: number, ability: AppAbilityType, collection: Collection | null = null) {
        const collectionIds = collection?.parts
            .filter((part) => part.id !== tmdbId)
            .map((part) => part.id) ?? [];

        const recommendations = this.llmService.generateMediaRecommendations(mediaId, ability)
            .map((recommendations) => recommendations.map(this.toSlimMedia));

        const collections = this.findMediaByTmdbIds(MediaType.MOVIE, collectionIds, ability)
            .map((collection) => collection.map(this.toSlimMedia))
            .sameOrder(collectionIds, 'tmdbId');

        return TaskEither
            .fromBind({
                recommendations,
                collections,
            })
            .map(({ recommendations, collections }) => [...collections, ...recommendations])
            .distinct('id');
    }

    /**
   * @description Get the next recommended video for a user
   * @param media - The media to get the next recommended video for
   * @param ability - The user's ability
   */
    getNextRecommendedVideo (media: Media, ability: AppAbilityType) {
        const watched = TaskEither
            .tryCatch(
                () => this.prismaService.seenMedia.findMany({
                    where: accessibleBy(ability, Action.Read).SeenMedia,
                }),
                'Error getting watched media',
            );

        const recommendations = this.llmService.generateMediaRecommendations(media.id, ability);

        return TaskEither
            .fromBind({
                watched,
                recommendations,
            })
            .map(({ watched, recommendations }) => {
                const nonWatched = difference(recommendations, watched, 'id', 'mediaId');

                if (nonWatched.length > 0) {
                    return nonWatched[0];
                }

                return recommendations[0];
            })
            .nonNullable('No recommendations found')
            .chain((media) => this.getVideoFromMedia(media, ability));
    }

    /**
   * @description Find media by tmdb ids
   * @param type - The media type
   * @param tmdbId - The tmdb ids
   * @param ability - The user's ability
   */
    findMediaByTmdbIds (type: MediaType, tmdbId: number[], ability?: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findMany({
                    where: {
                        AND: [
                            {
                                tmdbId: {
                                    'in': tmdbId,
                                },
                            },
                            {
                                type,
                            },
                            ability ?
                                {
                                    ...accessibleBy(ability, Action.Read).Media,
                                }
                                : {},
                        ],
                    },
                }),
                'Error getting media by tmdb ids',
            );
    }

    /**
     * @description Get the next recommended video for a user
     * @param media - The media to get the next recommended video for
     * @param ability - The user's ability
     */
    getVideoFromMedia (media: Media, ability: AppAbilityType) {
        const getVideoFromMovie = (media: InnerMedia) => Either
            .fromNullable(media.videos[0])
            .map((video) => {
                if (media.watched.length > 0) {
                    return {
                        ...video,
                        percentage: media.watched[0].percentage > COMPLETED_VIDEO_POSITION ? 0 : media.watched[0].percentage,
                        isLastEpisode: false,
                    };
                }

                return {
                    ...video,
                    percentage: 0,
                    isLastEpisode: false,
                };
            });

        const hasSeenNoEpisodes = (media: InnerMedia) => ({
            ...media.episodes[0].video,
            isLastEpisode: false,
            percentage: 0,
        });

        const hasNotFinishedCurrentEpisode = (media: InnerMedia) => ({
            ...media.watched[0].video,
            isLastEpisode: false,
            percentage: media.watched[0].percentage,
        });

        const hasFinishedLastEpisode = (media: InnerMedia) => ({
            ...media.episodes[0].video,
            isLastEpisode: true,
            percentage: 0,
        });

        const playNextEpisode = (media: InnerMedia, index: number) => ({
            ...media.episodes[index + 1].video,
            isLastEpisode: false,
            percentage: 0,
        });

        const hasFinishedCurrentEpisode = (media: InnerMedia) => Either
            .of(media.watched[0].video.episode)
            .map((episode) => media.episodes.findIndex((e) => e.id === episode?.id))
            .filter(
                (index) => index !== -1,
                () => createBadRequestError('Episode not found'),
            )
            .match([
                {
                    predicate: (index) => index === media.episodes.length - 1,
                    run: () => hasFinishedLastEpisode(media),
                },
                {
                    predicate: (index) => index !== -1,
                    run: (index) => playNextEpisode(media, index),
                },
            ]);

        const getVideoFromShow = (media: InnerMedia) => Either
            .of(media.watched.length === 0)
            .matchEither([
                {
                    predicate: (hasNotWatched) => hasNotWatched,
                    run: () => Either.of(hasSeenNoEpisodes(media)),
                },
                {
                    predicate: () => media.watched[0].percentage < COMPLETED_VIDEO_POSITION,
                    run: () => Either.of(hasNotFinishedCurrentEpisode(media)),
                },
                {
                    predicate: () => media.watched[0].percentage >= COMPLETED_VIDEO_POSITION,
                    run: () => hasFinishedCurrentEpisode(media),
                },
            ]);

        const matchMedia = (media: InnerMedia) => TaskEither
            .of(media)
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.MOVIE,
                    run: () => getVideoFromMovie(media).toTaskEither(),
                },
                {
                    predicate: (media) => media.type === MediaType.SHOW,
                    run: () => getVideoFromShow(media).toTaskEither(),
                },
            ])
            .io(() => TaskEither
                .tryCatch(
                    () => this.prismaService.seenMedia.deleteMany({
                        where: {
                            mediaId: media.id,
                            ...accessibleBy(ability, Action.Read).SeenMedia,
                        },
                    }),
                    'Error getting next recommended video',
                ));

        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findUnique({
                    where: {
                        id: media.id,
                    },
                    include: {
                        episodes: {
                            orderBy: [
                                {
                                    season: 'asc',
                                },
                                {
                                    episode: 'asc',
                                },
                            ],
                            include: {
                                video: {
                                    include: {
                                        episode: true,
                                    },
                                },
                            },
                        },
                        videos: {
                            include: {
                                episode: true,
                            },
                        },
                        watched: {
                            where: accessibleBy(ability, Action.Read).Watched,
                            orderBy: {
                                updated: 'desc',
                            },
                            include: {
                                video: {
                                    include: {
                                        episode: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting media by id',
            )
            .nonNullable('Media not found')
            .filter(
                (media) => media.videos.length > 0,
                () => createBadRequestError('No video found'),
            )
            .chain(matchMedia);
    }

    /**
     * @description Search the database for a media by query
     * @param query - The query to search for
     * @param paginatedArgs - The pagination arguments
     * @param ability - The user's ability
     */
    searchMedia ({ query, ...paginatedArgs }: SearchMediaArgs, ability: AppAbilityType) {
        return this.llmService.searchForMostSimilarMedia(query, paginatedArgs.pageSize, ability)
            .map((media) => ({
                page: 1,
                totalPages: 1,
                totalResults: media.length,
                results: media,
            }));
    }

    /**
     * @description Get the next recommended movie for a user
     * @param ability - The user's ability
     * @param media - The media to get the next recommended video for
     * @param lang - The user's language
     */
    getNextMovie (ability: AppAbilityType, media: Media, lang: LanguageReturn) {
        const collection = TaskEither
            .tryCatch(
                () => this.tmdb.getMovie(media.tmdbId, {
                    language: lang.alpha2,
                    append_to_response: {
                        collection: true,
                    },
                }),
                'Error getting movie details',
            )
            .map((movie) => movie.collection)
            .nonNullable('Movie has no collection')
            .map((collection) => {
                const index = collection.parts.findIndex((part) => part.id === media.tmdbId);

                return {
                    collection,
                    index,
                };
            })
            .filter(
                ({ index, collection }) => index < collection.parts.length - 1 && index > -1,
                () => createBadRequestError('Movie has no collection'),
            )
            .map(({ index, collection }) => collection.parts[index + 1])
            .chain((movie) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.findFirst({
                        where: {
                            AND: [
                                {
                                    tmdbId: movie.id,
                                },
                                {
                                    type: MediaType.MOVIE,
                                },
                                accessibleBy(ability, Action.Read).Media,
                            ],
                        },
                    }),
                    'Error getting next movie',
                ))
            .nonNullable('Next movie not found')
            .chain((movie) => this.getVideoFromMedia(movie, ability));

        const nextRecommended = this.getNextRecommendedVideo(media, ability);

        return TaskEither
            .fromFirstSuccess(collection, nextRecommended);
    }

    /**
     * @description Get the next recommended episode for a user
     * @param video - The video to get the next recommended video for
     * @param media - The media to get the next recommended episode for
     */
    getNextEpisode (video: Video, media: Media) {
        return TaskEither
            .of(media)
            .filter(
                (media) => media.type === MediaType.SHOW,
                () => createBadRequestError('Media has no episodes'),
            )
            .chain((media) => TaskEither
                .tryCatch(() => this.prismaService.episode.findMany({
                    where: {
                        showId: media.id,
                    },
                    include: {
                        video: true,
                    },
                    orderBy: [
                        {
                            season: 'asc',
                        },
                        {
                            episode: 'asc',
                        },
                    ],
                })))
            .map((episodes) => {
                const index = episodes.findIndex((episode) => episode.videoId === video.id);

                return index === episodes.length - 1 ? null : episodes[index + 1];
            })
            .orNull();
    }

    /**
     * @description Get the details of a media's videos from TMDb
     * @param media - The media to get the videos for
     * @param lang - The user's language
     * @param episode - The episode to get the videos for
     */
    getTmdbVideoDetails (media: Media, lang: LanguageReturn, episode: Episode | null) {
        const getMovie = TaskEither
            .tryCatch(
                () => this.tmdb.getMovie(media.tmdbId, {
                    language: lang.alpha2,
                    append_to_response: {
                        videos: true,
                        release_dates: true,
                    },
                }),
                'Error getting movie details',
            )
            .map(
                (details): TmdbVideoDetails => ({
                    name: details.title,
                    episodeName: null,
                    overview: details.overview,
                    episodeOverview: null,
                    episodeBackdrop: null,
                    imdbId: details.imdb_id,
                }),
            );

        const getShow = TaskEither
            .fromNullable(episode)
            .chain((episode) => TaskEither
                .tryCatch(
                    () => this.tmdb.getShow(media.tmdbId, {
                        language: lang.alpha2,
                        append_to_response: {
                            videos: true,
                            release_dates: true,
                            appendSeasons: [episode.season],
                            external_ids: true,
                        },
                    }),
                    'Error getting show details',
                )
                .chain((details) => TaskEither
                    .fromNullable(details.appendSeasons.find((s) => s.season_number === episode.season))
                    .chain((season) => TaskEither
                        .fromNullable(season.episodes.find((e) => e.episode_number === episode.episode))
                        .map(
                            (episode): TmdbVideoDetails => ({
                                episodeName: episode.name
                                    ? `S${episode.season_number}, E${episode.episode_number} - ${episode.name}`
                                    : `Season ${episode.season_number} Episode${episode.episode_number}`,
                                episodeBackdrop: episode.still_path
                                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                                    : null,
                                imdbId: details.external_ids.imdb_id,
                                episodeOverview: episode.overview,
                                overview: details.overview,
                                name: details.name,
                            }),
                        ))));

        return TaskEither.of(media)
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.MOVIE,
                    run: () => getMovie,
                },
                {
                    predicate: (media) => media.type === MediaType.SHOW,
                    run: () => getShow,
                },
            ]);
    }

    /**
   * @description Build a home response from a list of slim media
   * @param label - The label of the response
   * @param identifier - The identifier of the response, used for deduplication
   * @param type - The type of the response
   */
    buildHomeResponse<T extends SlimMedia> (label: string, identifier: string, type: HomeResponseTypes) {
        return (media: T[]): HomeResponse<T> => ({
            type,
            label,
            identifier,
            results: dedupeBy(media, 'id'),
        });
    }

    /**
   * @description Build a basic home response from a list of slim media
   * @param label - The label of the response
   * @param identifier - The identifier of the response, used for deduplication
   */
    buildBasicHomeResponse<T extends SlimMedia> (label: string, identifier: string) {
        return this.buildHomeResponse<T>(
            label,
            identifier,
            HomeResponseTypes.BASIC,
        );
    }

    /**
   * @description Build an editorial home response from a list of slim media
   * @param label - The label of the response
   * @param identifier - The identifier of the response, used for deduplication
   */
    buildEditorialHomeResponse<T extends SlimMedia> (label: string, identifier: string) {
        return this.buildHomeResponse<T>(
            label,
            identifier,
            HomeResponseTypes.EDITOR,
        );
    }

    /**
   * @description Get the recommendations for the home screen based on user's ability and activity
   * @param ability - The user's ability
   */
    getRecommendedHomeScreen (ability: AppAbilityType) {
        return TaskEither
            .weightedRandom([
                {
                    weight: 0.20,
                    value: this.recommendFromMedia(ability),
                },
                {
                    weight: 0.13,
                    value: this.recommendFromGenres(ability),
                },
                {
                    weight: 0.17,
                    value: this.recommendFromCharacters(ability),
                },
                {
                    weight: 0.15,
                    value: this.recommendFromActors(ability),
                },
                {
                    weight: 0.12,
                    value: this.recommendFromCredit(ability),
                },
                {
                    weight: 0.11,
                    value: this.recommendFromCompanies(ability),
                },
                {
                    weight: 0.12,
                    value: this.basicRecommendations(ability),
                },
            ])
            .filter(
                (rec) => rec.results.length > 1,
                () => createBadRequestError('No recommendations found'),
            );
    }

    /**
   * @description Get the recommendations for the home screen based on user's ability and activity
   * @param ability - The user's ability
   */
    getUserRecommendations (ability: AppAbilityType) {
        const getRecommendations = (media: RecItem) => this
            .llmService
            .generateMediaRecommendations(media.mediaId, ability, 5)
            .mapItems((item) => ({
                mediaId: item.id,
                count: media.count,
                genres: item.genres,
            }));

        const processRecItems = (recs: RecItem[]) => TaskEither
            .of(recs)
            .chainItems(getRecommendations)
            .aggregate(
                (recs) => TaskEither.of({
                    mediaId: recs[0].mediaId,
                    genres: recs[0].genres,
                    count: recs.reduce((acc, curr) => acc + curr.count, 0),
                }),
                'mediaId',
            )
            .filterItems((rec) => rec.count > 0)
            .sortBy('count', 'desc')
            .chain((newRecs) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        take: 20,
                        where: {
                            AND: [
                                {
                                    id: {
                                        'in': newRecs.map((rec) => rec.mediaId),
                                    },
                                },
                                {
                                    id: {
                                        notIn: recs.map((rec) => rec.mediaId),
                                    },
                                },
                                accessibleBy(ability, Action.Read).Media,
                            ],
                        },
                    }),
                    'Error getting recommended media',
                )
                .sameOrder(newRecs.map((rec) => rec.mediaId), 'id'))
            .mapItems(this.toSlimMedia);

        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findMany({
                    where: accessibleBy(ability, Action.Read).Media,
                    include: {
                        ratings: {
                            where: accessibleBy(ability, Action.Read).Rating,
                            select: {
                                rate: true,
                            },
                        },
                        seenMedia: {
                            where: accessibleBy(ability, Action.Read).SeenMedia,
                            select: {
                                times: true,
                            },
                        },
                        watched: {
                            where: accessibleBy(ability, Action.Read).Watched,
                            select: {
                                times: true,
                            },
                        },
                        _count: {
                            select: {
                                lists: {
                                    where: accessibleBy(ability, Action.Read).ListItem,
                                },
                            },
                        },
                        credits: {
                            select: {
                                name: true,
                                job: true,
                                character: true,
                                tmdbId: true,
                            },
                        },
                        companies: {
                            include: {
                                company: true,
                            },
                        },
                    },
                }),
                'Error getting recommended media',
            )
            .mapItems((media) => ({
                mediaId: media.id,
                name: media.name,
                genres: media.genres,
                credits: media.credits,
                companies: media.companies.map((company) => ({
                    companyId: company.companyId,
                    companyName: company.company.name,
                })),
                count: (media.ratings.reduce((acc, curr) => acc + (curr.rate ? 10 : -100), 0) * RATING_VALUE_COUNT) +
                    (media.seenMedia.reduce((acc, curr) => acc + curr.times, 0) * SEEN_VALUE_COUNT) +
                    (media.watched.reduce((acc, curr) => acc + curr.times, 0) * 2) +
                    (media._count.lists * LIST_VALUE_COUNT),
            }))
            .filterItems((media) => media.count !== 0)
            .sortBy('count', 'desc')
            .chain(processRecItems)
            .map(this.buildEditorialHomeResponse('just for you', 'user-recommendations'));
    }

    private baseRecommendations (ability: AppAbilityType) {
        const seenMedia = TaskEither
            .tryCatch(
                () => this.prismaService.seenMedia.findMany({
                    where: accessibleBy(ability, Action.Read).SeenMedia,
                    include: {
                        media: {
                            include: {
                                credits: {
                                    select: {
                                        name: true,
                                        job: true,
                                        character: true,
                                        tmdbId: true,
                                    },
                                },
                                companies: {
                                    include: {
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting seen media',
            )
            .mapItems((seen): RecItem => ({
                mediaId: seen.mediaId,
                credits: seen.media.credits,
                companies: seen.media.companies.map((company) => ({
                    companyId: company.companyId,
                    companyName: company.company.name,
                })),
                genres: seen.media.genres,
                count: seen.times,
            }));

        const myList = TaskEither
            .tryCatch(
                () => this.prismaService.listItem.findMany({
                    where: accessibleBy(ability, Action.Read).ListItem,
                    include: {
                        media: {
                            include: {
                                credits: {
                                    select: {
                                        name: true,
                                        job: true,
                                        character: true,
                                        tmdbId: true,
                                    },
                                },
                                companies: {
                                    include: {
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting my list',
            )
            .mapItems((list): RecItem => ({
                mediaId: list.mediaId,
                credits: list.media.credits,
                companies: list.media.companies.map((company) => ({
                    companyId: company.companyId,
                    companyName: company.company.name,
                })),
                genres: list.media.genres,
                count: LIST_VALUE_COUNT,
            }));

        const watched = TaskEither
            .tryCatch(
                () => this.prismaService.watched.groupBy({
                    by: ['mediaId'],
                    _sum: {
                        times: true,
                    },
                    _count: {
                        mediaId: true,
                    },
                    where: accessibleBy(ability, Action.Read).Watched,
                }),
                'Error getting watched media',
            )
            .mapItems((watched) => ({
                mediaId: watched.mediaId,
                count: watched._count.mediaId * (watched._sum.times ?? 1),
            }))
            .chain((watched) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.findMany({
                        where: {
                            id: {
                                'in': watched.map((w) => w.mediaId),
                            },
                        },
                        include: {
                            credits: {
                                select: {
                                    name: true,
                                    job: true,
                                    character: true,
                                    tmdbId: true,
                                },
                            },
                            companies: {
                                include: {
                                    company: true,
                                },
                            },
                        },
                    }),
                    'Error getting watched media',
                )
                .intersect(watched, 'id', 'mediaId', ['count']))
            .mapItems((media): RecItem => ({
                mediaId: media.id,
                credits: media.credits,
                companies: media.companies.map((company) => ({
                    companyId: company.companyId,
                    companyName: company.company.name,
                })),
                genres: media.genres,
                count: media.count * 2,
            }));

        const ratings = TaskEither
            .tryCatch(
                () => this.prismaService.rating.findMany({
                    where: accessibleBy(ability, Action.Read).Rating,
                    include: {
                        media: {
                            include: {
                                credits: {
                                    select: {
                                        name: true,
                                        job: true,
                                        character: true,
                                        tmdbId: true,
                                    },
                                },
                                companies: {
                                    include: {
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting rated media',
            )
            .mapItems((rating): RecItem => ({
                mediaId: rating.mediaId,
                genres: rating.media.genres,
                credits: rating.media.credits,
                companies: rating.media.companies.map((company) => ({
                    companyId: company.companyId,
                    companyName: company.company.name,
                })),
                count: RATING_VALUE_COUNT * (rating.rate ? 10 : -100),
            }));

        const aggregate = (section: RecItem[]) => {
            const sum = section.reduce((acc, curr) => acc + curr.count, 0);

            return TaskEither
                .fromNullable(section[0])
                .map((first): RecItem => ({
                    mediaId: first.mediaId,
                    credits: first.credits,
                    companies: first.companies,
                    genres: first.genres,
                    count: sum,
                }));
        };

        return TaskEither
            .fromBind({
                seenMedia,
                myList,
                watched,
                ratings,
            })
            .chain(({ seenMedia, myList, watched, ratings }) => TaskEither.of([seenMedia, myList, watched, ratings])
                .aggregate(aggregate, 'mediaId')
                .sortBy('count', 'desc')
                .map((recommended) => ({
                    recommended,
                    seenMedia,
                    myList,
                    watched,
                    ratings,
                })));
    }

    private recommendFromMedia (ability: AppAbilityType) {
        return this.baseRecommendations(ability)
            .chain((recs) => TaskEither
                .of(recs.recommended.slice(0, 10))
                .shuffle()
                .map(([rec]) => rec)
                .nonNullable('No recommendations found')
                .chain((rec) => TaskEither
                    .tryCatch(
                        () => this.prismaService.media.findUnique({
                            where: {
                                ...accessibleBy(ability, Action.Read).Media,
                                id: rec.mediaId,
                            },
                        }),
                        'Error getting recommended media',
                    ))
                .nonNullable('Recommended media not found')
                .chain((media) => this.llmService.generateMediaRecommendations(media.id, ability))
                .difference(recs.watched, 'id', 'mediaId'))
            .mapItems(this.toSlimMedia)
            .map(this.buildBasicHomeResponse('what to watch next', 'media-recommendations'));
    }

    private recommendFromGenres (ability: AppAbilityType) {
        return this.baseRecommendations(ability)
            .chain((recs) => TaskEither
                .of(recs.recommended.map((rec) => rec.genres.map((genre) => ({
                    genre,
                    ...rec,
                }))))
                .aggregate(
                    (section) => TaskEither
                        .fromNullable(section[0])
                        .map((first) => ({
                            genre: first.genre,
                            count: section.reduce((acc, curr) => acc + curr.count, 0),
                        })),
                    'genre',
                )
                .sortBy('count', 'desc')
                .map((recs) => recs.slice(0, 10))
                .shuffle()
                .map(([rec]) => rec)
                .nonNullable('No recommendations found')
                .chain((rec) => TaskEither
                    .tryCatch(
                        () => this.prismaService.media.random({
                            where: {
                                genres: {
                                    has: rec.genre,
                                },
                                ...accessibleBy(ability, Action.Read).Media,
                            },
                            take: 20,
                        }),
                        'Error getting recommended media',
                    )
                    .difference(recs.watched, 'id', 'mediaId')
                    .mapItems(this.toSlimMedia)
                    .map(this.buildBasicHomeResponse(`see more ${rec.genre.toLowerCase()} media`, `genre-recommendations-${rec.genre}`))));
    }

    private recommendFromCharacters (ability: AppAbilityType) {
        return this.baseRecommendations(ability)
            .map((rec) => rec.recommended)
            .mapItems((rec) => rec.credits.map((credit) => ({
                character: credit.character || 'no character',
                ...rec,
            })))
            .aggregate(
                (section) => TaskEither
                    .fromNullable(section[0])
                    .map((first) => ({
                        character: first.character,
                        count: section.reduce((acc, curr) => acc + curr.count, 0),
                    })),
                'character',
            )
            .filterItems((rec) => rec.character !== 'no character')
            .sortBy('count', 'desc')
            .map((recs) => recs.slice(0, 10))
            .shuffle()
            .map(([rec]) => rec)
            .nonNullable('No recommendations found')
            .chain((rec) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        where: {
                            credits: {
                                some: {
                                    character: rec.character,
                                },
                            },
                            ...accessibleBy(ability, Action.Read).Media,
                        },
                        take: 20,
                    }),
                    'Error getting recommended media',
                )
                .mapItems(this.toSlimMedia)
                .map(this.buildBasicHomeResponse(`more media portraying ${rec.character.toLowerCase()}`, `character-recommendations-${rec.character}`)));
    }

    private recommendFromActors (ability: AppAbilityType) {
        return this.baseRecommendations(ability)
            .map((rec) => rec.recommended)
            .mapItems((rec) => rec.credits.map((credit) => ({
                actor: credit.name,
                character: credit.character || 'no character',
                ...rec,
            })))
            .aggregate(
                (section) => TaskEither
                    .fromNullable(section[0])
                    .map((first) => ({
                        actor: first.actor,
                        character: first.character,
                        count: section.reduce((acc, curr) => acc + curr.count, 0),
                    })),
                'actor',
            )
            .filterItems((rec) => rec.character !== 'no character')
            .sortBy('count', 'desc')
            .map((recs) => recs.slice(0, 10))
            .shuffle()
            .map(([rec]) => rec)
            .nonNullable('No recommendations found')
            .chain((rec) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        where: {
                            credits: {
                                some: {
                                    AND: [
                                        {
                                            name: rec.actor,
                                        },
                                        {
                                            NOT: {
                                                character: null,
                                            },
                                        },
                                    ],
                                },
                            },
                            ...accessibleBy(ability, Action.Read).Media,
                        },
                        take: 20,
                    }),
                    'Error getting recommended media',
                )
                .mapItems(this.toSlimMedia)
                .map(this.buildBasicHomeResponse(`more media starring ${rec.actor.toLowerCase()}`, `actor-recommendations-${rec.actor}`)));
    }

    private recommendFromCredit (ability: AppAbilityType) {
        const task = (predicate: (credit: CreditItem) => boolean, key: string, jobs: string[]) => this
            .baseRecommendations(ability)
            .map((rec) => rec.recommended)
            .mapItems((rec) => rec.credits
                .filter(predicate)
                .map((credit) => ({
                    person: credit.name,
                    ...rec,
                })))
            .aggregate(
                (section) => TaskEither
                    .fromNullable(section[0])
                    .map((first) => ({
                        person: first.person,
                        count: section.reduce((acc, curr) => acc + curr.count, 0),
                    })),
                'person',
            )
            .sortBy('count', 'desc')
            .map((recs) => recs.slice(0, 10))
            .shuffle()
            .map(([rec]) => rec)
            .nonNullable('No recommendations found')
            .chain((rec) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        where: {
                            credits: {
                                some: {
                                    name: rec.person,
                                    job: {
                                        'in': jobs,
                                    },
                                },
                            },
                            ...accessibleBy(ability, Action.Read).Media,
                        },
                        take: 20,
                    }),
                    'Error getting recommended media',
                )
                .mapItems(this.toSlimMedia)
                .map(this.buildBasicHomeResponse(`more media ${key} by ${rec.person.toLowerCase()}`, `${key}-recommendations-${rec.person}`)));

        const directors = task((credit) => credit.job === 'Director', 'directed', ['Director']);
        const writers = task((credit) => (/^Writer|Story|Screenplay$/i).test(credit.job || ''), 'written', ['Writer', 'Story', 'Screenplay']);
        const producers = task((credit) => credit.job === 'Executive Producer', 'produced', ['Executive Producer']);

        return TaskEither
            .weightedRandom([
                {
                    weight: 0.5,
                    value: directors,
                },
                {
                    weight: 0.3,
                    value: writers,
                },
                {
                    weight: 0.2,
                    value: producers,
                },
            ]);
    }

    private recommendFromCompanies (ability: AppAbilityType) {
        return this.baseRecommendations(ability)
            .map((rec) => rec.recommended)
            .mapItems((rec) => rec.companies.map((company) => ({
                companyId: company.companyId,
                companyName: company.companyName,
                ...rec,
            })))
            .aggregate(
                (section) => TaskEither
                    .fromNullable(section[0])
                    .map((first) => ({
                        companyId: first.companyId,
                        companyName: first.companyName,
                        count: section.reduce((acc, curr) => acc + curr.count, 0),
                    })),
                'companyId',
            )
            .sortBy('count', 'desc')
            .map((recs) => recs.slice(0, 10))
            .shuffle()
            .map(([rec]) => rec)
            .nonNullable('No recommendations found')
            .chain((rec) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        where: {
                            companies: {
                                some: {
                                    companyId: rec.companyId,
                                },
                            },
                            ...accessibleBy(ability, Action.Read).Media,
                        },
                        take: 20,
                    }),
                    'Error getting recommended media',
                )
                .mapItems(this.toSlimMedia)
                .map(this.buildBasicHomeResponse(`more media by ${rec.companyName.toLowerCase()}`, `company-recommendations-${rec.companyId}`)));
    }

    private basicRecommendations (ability: AppAbilityType) {
        const displays = ['check these out', 'something new to watch', 'frames suggest', ' you would probably love these', 'nothing else to watch?', 'how about one of these'];
        const label = displays[Math.floor(Math.random() * displays.length)];

        return TaskEither
            .tryCatch(
                () => this.prismaService.view.findMany({
                    where: accessibleBy(ability, Action.Manage).View,
                    include: {
                        video: {
                            include: {
                                media: {
                                    select: {
                                        id: true,
                                        genres: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting view history',
            )
            .mapItems((view) => view.video.media)
            .distinct('id')
            .chain((media) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.random({
                        where: {
                            NOT: {
                                id: {
                                    'in': media.map((m) => m.id),
                                },
                            },
                            genres: {
                                hasSome: media.flatMap((m) => m.genres),
                            },
                        },
                        take: 20,
                    }),
                    'Error getting recommended media',
                )
                .distinct('id')
                .mapItems((media) => this.toSlimMedia(media))
                .map(this.buildBasicHomeResponse(label, `basic-recommendations-${Date.now()}`)));
    }
}
