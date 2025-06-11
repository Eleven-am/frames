import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither, sortBy, intersect, sameOrder, Either, groupBy } from '@eleven-am/fp';
import {
    AppendedContentRatings,
    AppendedCredits,
    AppendedReleaseDates,
    AppendedVideos,
    BaseSeason,
    Collection,
    ContentRatingsResult,
    Genre,
    MiniMovie,
    MiniTVShow,
    Movie,
    Person,
    TVShow,
} from '@eleven-am/tmdbapi';
import { Injectable } from '@nestjs/common';
import { Company, Episode, Media, MediaType } from '@prisma/client';
import { intervalToDuration } from 'date-fns';
import FuseJS from 'fuse.js';

import {
    FilterGenreArgs,
    FilterMediaArgs,
    GetIdFromQueryArgs,
    SearchMediaArgs,
    CastResponse,
    CompanyResponse,
    CrewResponse,
    DetailedMedia,
    EpisodeResponse,
    FinMediaTypes,
    LevenshteinMatch,
    MediaExtras,
    MediaPartialDetails,
    MediaResponse,
    MediaSection,
    NetworkResponse,
    PartialOptions,
    PersonResponse,
    SearchedMedia,
    SeasonResponse,
    SlimMedia,
    VideoType,
} from './media.contracts';
import { RecommendationsService } from './recommendations.service';
import { LanguageService } from '../language/language.service';
import { LanguageReturn } from '../language/language.types';
import { TmdbService } from '../misc/tmdb.service';
import { PlaybackService } from '../playback/playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';
import { mapPageResponse } from '../utils/helper.fp';
import { PageResponse } from '../utils/utils.contracts';


@Injectable()
export class MediaService {
    constructor (
        private readonly tmdb: TmdbService,
        private readonly prisma: PrismaService,
        private readonly playbackService: PlaybackService,
        private readonly languageService: LanguageService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @description Get media by id in the user's language
     * @param media - The media to get
     * @param session - The user's session
     * @param ability - The user's ability
     */
    getMediaById (media: Media, session: CachedSession, ability: AppAbilityType) {
        const language = session.language;

        return TaskEither
            .of(media)
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.MOVIE,
                    run: (media) => this.getMovieById(media.id, ability, language),
                },
                {
                    predicate: (media) => media.type === MediaType.SHOW,
                    run: (media) => this.getShowById(media.id, ability, language),
                },
            ])
            .map(this.manageMediaSections);
    }

    /**
     * @description Get the trending media in the user's language
     * @param ability - The user's ability
     * @param language - The user's language
     */
    getTrendingHomeScreen (ability: AppAbilityType, language: LanguageReturn) {
        return this.getTrendingMedia(ability, language)
            .map(this.recommendationsService.buildBasicHomeResponse('what others are watching', 'trending'));
    }

    /**
   * @description Get the trending media in the default language, useful for display around the app
   */
    getTrending () {
        return this.getTrendingMedia();
    }

    /**
     * @description Get the popular media in the user's language
     * @param language - The user's language
     * @param ability - The user's ability
     */
    getPopularHomeScreen (language: LanguageReturn, ability: AppAbilityType) {
        return this.getPopularMedia(language, ability)
            .map(this.recommendationsService.buildBasicHomeResponse('the most popular media right now', 'popular'));
    }

    /**
     * @description Get the top-rated media in the user's language
     * @param language - The user's language
     * @param ability - The user's ability
     */
    getTopRatedHomeScreen (language: LanguageReturn, ability: AppAbilityType) {
        return this.getTopRatedMedia(language, ability)
            .map(this.recommendationsService.buildBasicHomeResponse('the top rated media', 'topRated'));
    }

    /**
     * @description Get the tv shows that are airing today or this week in the user's language
     * @param language - The user's language
     * @param ability - The user's ability
     */
    getAiringTodayHomeScreen (language: LanguageReturn, ability: AppAbilityType) {
        return this.getAiringToday(language, ability)
            .map(this.recommendationsService.buildBasicHomeResponse('what\'s airing today', 'airingToday'));
    }

    /**
     * @description Get the movies that are now playing in theaters in the user's language
     * @param language - The user's language
     * @param ability - The user's ability
     */
    getNowPlayingHomeScreen (language: LanguageReturn, ability: AppAbilityType) {
        return this.getNowPlayingMovies(language, ability)
            .map(this.recommendationsService.buildBasicHomeResponse('now playing in theaters', 'nowPlaying'));
    }

    /**
     * @description Search the database for a media by query
     * @param query - The query to search for
     * @param paginatedArgs - The pagination arguments
     * @param ability - The user's ability
     */
    searchMedia ({ query, ...paginatedArgs }: SearchMediaArgs, ability: AppAbilityType) {
        const underTwoTask = TaskEither.of<PageResponse<SlimMedia>>({
            page: 1,
            totalPages: 0,
            totalResults: 0,
            results: [],
        });

        const queryMediaTask = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        AND: [
                            {
                                OR: [
                                    {
                                        name: {
                                            startsWith: query,
                                            mode: 'insensitive',
                                        },
                                    },
                                    {
                                        name: {
                                            contains: ` ${query}`,
                                            mode: 'insensitive',
                                        },
                                    },
                                ],
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    paginate: paginatedArgs,
                }),
                'Error querying media by name',
            )
            .map(mapPageResponse(this.recommendationsService.toSlimMedia));

        const queryCastTask = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        AND: [
                            {
                                credits: {
                                    some: {
                                        OR: [
                                            {
                                                name: {
                                                    contains: query,
                                                    mode: 'insensitive',
                                                },
                                            },
                                            {
                                                character: {
                                                    contains: query,
                                                    mode: 'insensitive',
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    paginate: paginatedArgs,
                }),
                'Error querying media by cast',
            )
            .map(mapPageResponse(this.recommendationsService.toSlimMedia));

        const queryModelTask = this.recommendationsService.searchMedia({
            query,
            ...paginatedArgs,
        },
        ability);

        const noResult = ({ response }: { response: PageResponse<SlimMedia> }) => response.results.length === 0;

        const runNextQuery = ({ count }: { count: number }) => TaskEither
            .of(count)
            .matchTask([
                {
                    predicate: (count) => count === 0,
                    run: () => queryMediaTask,
                },
                {
                    predicate: (count) => count === 1,
                    run: () => queryCastTask,
                },
                {
                    predicate: (count) => count === 2,
                    run: () => queryModelTask,
                },
            ])
            .map((response) => ({
                count: count + 1,
                response,
            }));

        const executeAction = TaskEither
            .fromBind({
                count: TaskEither.of(0),
                response: underTwoTask,
            })
            .while(noResult, runNextQuery)
            .map(({ response }) => response);

        return TaskEither
            .of(query)
            .matchTask([
                {
                    predicate: (query) => query.length < 2,
                    run: () => underTwoTask,
                },
                {
                    predicate: (query) => query.length >= 2,
                    run: () => executeAction,
                },
            ]);
    }

    /**
   * @description Performs a fuzzy search on the media database
   * @param query - The query to search for
   */
    fuzzySearch (query: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                }),
                'Error getting media for fuzzy search',
            )
            .map((media) => {
                const fuse = new FuseJS(media, {
                    keys: ['name'],
                    threshold: 0.3,
                    includeScore: true,
                }) as FuseJS<{id: string, name: string, type: MediaType}>;

                return fuse.search(query);
            })
            .sortBy('score', 'asc')
            .mapItems((result): LevenshteinMatch => result.item);
    }

    /**
     * @description Get the genres for a media type
     * @param type - The media type
     * @param genres - The genres to filter by
     * @param decade - The decade to filter by
     * @param ability - The user's ability
     */
    filterGenres ({ type, genres, decade }: FilterGenreArgs, ability: AppAbilityType) {
        const genresAndDecades = TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        type,
                        genres: {
                            hasEvery: genres,
                        },
                        releaseDate: {
                            gte: new Date(decade, 0, 1),
                            lt: new Date(decade + 10, 0, 1),
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    select: {
                        genres: true,
                    },
                }),
                'Error filtering genres',
            );

        const decadesOnly = TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        type,
                        releaseDate: {
                            gte: new Date(decade, 0, 1),
                            lt: new Date(decade + 10, 0, 1),
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    select: {
                        genres: true,
                    },
                }),
                'Error filtering decades',
            );

        const genresOnly = TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        type,
                        genres: {
                            hasEvery: genres,
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    select: {
                        genres: true,
                    },
                }),
                'Error filtering genres',
            );

        const defaultCase = TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        type,
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    select: {
                        genres: true,
                    },
                }),
                'Error filtering genres',
            );

        return TaskEither.of({
            genres,
            decade,
        })
            .matchTask([
                {
                    predicate: ({ genres, decade }) => genres.length > 0 && decade > 0,
                    run: () => genresAndDecades,
                },
                {
                    predicate: ({ genres, decade }) => genres.length > 0 && decade === 0,
                    run: () => genresOnly,
                },
                {
                    predicate: ({ genres, decade }) => genres.length === 0 && decade > 0,
                    run: () => decadesOnly,
                },
                {
                    predicate: ({ genres, decade }) => genres.length === 0 && decade === 0,
                    run: () => defaultCase,
                },
            ])
            .map((response) => response.flatMap((media) => media.genres))
            .map((genres) => [...new Set(genres)].sort());
    }

    /**
     * @description Get the media for a filter
     * @param type - The media type
     * @param genres - The genres to filter by
     * @param decade - The decade to filter by
     * @param paginatedArgs - The pagination arguments
     * @param ability - The user's ability
     */
    filterMedia ({ type, genres, decade, ...paginatedArgs }: FilterMediaArgs, ability: AppAbilityType) {
        const filterGenresAndDecades = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        type,
                        genres: {
                            hasEvery: genres,
                        },
                        releaseDate: {
                            gte: new Date(decade, 0, 1),
                            lt: new Date(decade + 10, 0, 1),
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    paginate: paginatedArgs,
                }),
                'Error filtering media by genres and decades',
            );

        const filterGenres = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        type,
                        genres: {
                            hasEvery: genres,
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    paginate: paginatedArgs,
                    orderBy: {
                        name: 'asc',
                    },
                }),
                'Error filtering media by genres',
            );

        const filterDecades = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        type,
                        releaseDate: {
                            gte: new Date(decade, 0, 1),
                            lt: new Date(decade + 10, 0, 1),
                        },
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    paginate: paginatedArgs,
                    orderBy: {
                        name: 'asc',
                    },
                }),
                'Error filtering media by decades',
            );

        const defaultCase = TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        type,
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    paginate: paginatedArgs,
                    orderBy: {
                        name: 'asc',
                    },
                }),
                'Error filtering media',
            );

        return TaskEither
            .of({
                genres,
                decade,
            })
            .matchTask([
                {
                    predicate: ({ genres, decade }) => genres.length > 0 && decade > 0,
                    run: () => filterGenresAndDecades,
                },
                {
                    predicate: ({ genres, decade }) => genres.length > 0 && decade === 0,
                    run: () => filterGenres,
                },
                {
                    predicate: ({ genres, decade }) => genres.length === 0 && decade > 0,
                    run: () => filterDecades,
                },
                {
                    predicate: ({ genres, decade }) => genres.length === 0 && decade === 0,
                    run: () => defaultCase,
                },
            ])
            .map(mapPageResponse(this.recommendationsService.toSlimMedia));
    }

    /**
     * @description Get the details of a distribution or network by id
     * @param id - The id of the network or distribution
     * @param ability - The user's ability
     */
    getCompanyById (id: string, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.company.findUnique({
                    where: {
                        id,
                    },
                    include: {
                        media: {
                            where: {
                                media: accessibleBy(ability, Action.Read).Media,
                            },
                            include: {
                                media: true,
                            },
                        },
                    },
                }),
                'Error getting company by id',
            )
            .nonNullable('Company not found')
            .map(
                (company): NetworkResponse => ({
                    id: company.id,
                    name: company.name,
                    type: company.type,
                    logo: (/null/).test(company.logo) ? null : company.logo,
                    movies: sortBy(
                        company.media
                            .filter((media) => media.media.type === MediaType.MOVIE)
                            .map((media) => this.recommendationsService.toSlimMedia(media.media)),
                        'name',
                        'asc',
                    ),
                    shows: sortBy(
                        company.media
                            .filter((media) => media.media.type === MediaType.SHOW)
                            .map((media) => this.recommendationsService.toSlimMedia(media.media)),
                        'name',
                        'asc',
                    ),
                }),
            );
    }

    /**
     * @description Get the details of a person by id
     * @param id - The id of the person
     * @param ability - The user's ability
     * @param lang - The user's language
     */
    getPersonById (id: number, ability: AppAbilityType, lang?: LanguageReturn) {
        const getPerson = TaskEither
            .tryCatch(
                () => this.tmdb.getPerson(id, {
                    language: lang?.alpha2,
                    append_to_response: {
                        movie_credits: true,
                        tv_credits: true,
                        images: true,
                    },
                }),
                'Error getting person by id',
            );

        const getMedia = (person: Person<{movie_credits: true, tv_credits: true, images: true}>) => TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    {
                                        AND: [
                                            {
                                                type: MediaType.MOVIE,
                                            },
                                            {
                                                tmdbId: {
                                                    'in': person.movie_credits.cast
                                                        .map((movie) => movie.id)
                                                        .concat(
                                                            person.movie_credits.crew.map(
                                                                (movie) => movie.id,
                                                            ),
                                                        ),
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        AND: [
                                            {
                                                type: MediaType.SHOW,
                                            },
                                            {
                                                tmdbId: {
                                                    'in': person.tv_credits.cast
                                                        .map((show) => show.id)
                                                        .concat(
                                                            person.tv_credits.crew.map((show) => show.id),
                                                        ),
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                }),
                'Error getting person credits',
            )
            .mapItems(this.recommendationsService.toSlimMedia)
            .map((media) => ({
                movies: media.filter((m) => m.type === MediaType.MOVIE),
                shows: media.filter((m) => m.type === MediaType.SHOW),
                person,
            }));

        const getIntersections = ({ movies, shows, person }: { movies: SlimMedia[], shows: SlimMedia[], person: Person<{movie_credits: true, tv_credits: true, images: true}> }) => {
            const intersectedCastMovies = intersect(movies, person.movie_credits.cast, 'tmdbId', 'id', ['character', 'popularity']);
            const intersectedCrewMovies = intersect(movies, person.movie_credits.crew, 'tmdbId', 'id', ['job', 'popularity']);
            const intersectedCastShows = intersect(shows, person.tv_credits.cast, 'tmdbId', 'id', ['character', 'popularity']);
            const intersectedCrewShows = intersect(shows, person.tv_credits.crew, 'tmdbId', 'id', ['job', 'popularity']);

            const staredIn = sortBy(
                [...intersectedCastMovies, ...intersectedCastShows],
                'popularity',
                'desc',
            );

            const crewedIn = sortBy(
                [...intersectedCrewMovies, ...intersectedCrewShows],
                'popularity',
                'desc',
            );

            const wroteFor = crewedIn.filter((credit) => (/^Writer|Story|Screenplay$/i).test(credit.job));
            const directed = crewedIn.filter((credit) => credit.job.includes('Director'));
            const produced = crewedIn.filter((credit) => credit.job.includes('Producer'));

            return {
                id: person.id,
                name: person.name,
                biography: person.biography,
                birthday: person.birthday,
                gender: person.gender,
                staredIn,
                wroteFor,
                directed,
                produced,
                profile: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
            } as PersonResponse;
        };

        return getPerson
            .chain(getMedia)
            .map(getIntersections);
    }

    /**
     * @description Groups the media in the database by decades
     * @param type - The media type
     * @param ability - The user's ability
     */
    getDecades (type: MediaType, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        type,
                        ...accessibleBy(ability, Action.Read).Media,
                    },
                    select: {
                        releaseDate: true,
                    },
                }),
                'Error getting media for decades',
            )
            .map((media) => media.map((media) => {
                const year = media.releaseDate?.getFullYear() ?? 0;

                return Math.floor(year / 10) * 10;
            }))
            .map((decades) => [...new Set(decades)].sort());
    }

    /**
     * @description Get the current trending media with more details
     * @param ability - The user's ability
     * @param language - The user's language
     */
    getTrendingBanner (ability: AppAbilityType, language: LanguageReturn) {
        return this.getTrendingMedia(ability, language)
            .chainItems(this.getMediaDetails(language));
    }

    /**
     * @description Search the database for a media by query and include videos
     * @param query - The query to search for
     * @param paginatedArgs - The pagination arguments
     * @param ability - The user's ability
     */
    searchMediaWithVideos ({ query, ...paginatedArgs }: SearchMediaArgs, ability: AppAbilityType) {
        if (query.length < 2) {
            return TaskEither.of({
                page: 1,
                totalPages: 0,
                totalResults: 0,
                results: [],
            });
        }

        return TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        AND: [
                            {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    include: {
                        videos: {
                            include: {
                                episode: true,
                            },
                        },
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    paginate: paginatedArgs,
                }),
                'Error querying media by name',
            )
            .map(mapPageResponse((item): SearchedMedia => {
                const videos = item.videos.map((video) => ({
                    videoId: video.id,
                    backdrop: item.backdrop,
                    backdropBlur: item.backdropBlur,
                    name: `${item.name}${video.episode !== null ? ` - S${video.episode.season}, E${video.episode.episode}` : ''}`,
                    season: video.episode?.season ?? null,
                    episode: video.episode?.episode ?? null,
                }));

                return {
                    ...this.recommendationsService.toSlimMedia(item),
                    videos,
                };
            }));
    }

    /**
   * @description Get the details of a media by id
   * @param language - The user's language
   */
    getMediaDetails (language: LanguageReturn) {
        return (media: SlimMedia) => this.getPartialDetails(media.tmdbId, media.type, language)
            .map(
                (details): DetailedMedia => ({
                    ...media,
                    ...details,
                }),
            );
    }

    /**
   * @description Get the details of a media by tmdb id and type
   * @param tmdbId - The tmdb id of the media
   * @param type - The type of the media
   * @param language - The user's language
   */
    getPartialDetails (tmdbId: number, type: MediaType, language: LanguageReturn) {
        return TaskEither
            .tryCatch(
                () => this.tmdb.getMedia(tmdbId, type, {
                    language: language.alpha2,
                    append_to_response: {
                        release_dates: true,
                        videos: true,
                        content_ratings: true,
                    },
                }),
                'Error getting movie details',
            )
            .map((details) => {
                if ('release_dates' in details) {
                    return this.buildMovieDetails(
                        details as Movie<PartialOptions>,
                        language,
                    );
                }

                return this.buildTvDetails(
                    details as TVShow<PartialOptions>,
                    language,
                );
            });
    }

    /**
     * @description Get a playback session for a user and the specified media
     * @param session - The session of the user
     * @param media - The media to get the playback session for
     * @param ability - The user's ability
     */
    playMedia (session: CachedSession, media: Media, ability: AppAbilityType) {
        return TaskEither.of(media)
            .chain((media) => this.recommendationsService.getVideoFromMedia(media, ability))
            .chain((video) => this.playbackService.getPlaybackSession({
                video,
                cachedSession: session,
                percentage: video.percentage,
            }));
    }

    /**
     * @description Get the playback session for a user and an episode
     * @param session - The session of the user to get the playback session for
     * @param episode - The episode to get the playback session for
     * @param reset - Whether to reset the playback session
     */
    playEpisode (session: CachedSession, episode: Episode, reset = false) {
        return TaskEither
            .tryCatch(
                () => this.prisma.episode.findFirst({
                    where: {
                        id: episode.id,
                        media: {},
                    },
                    include: {
                        video: {
                            include: {
                                episode: true,
                                watched: {
                                    where: {
                                        userId: session.user.id,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting video for episode',
            )
            .nonNullable('Episode not found')
            .chain((episode) => this.playbackService.getPlaybackSession(
                {
                    video: episode.video,
                    cachedSession: session,
                    percentage: reset ? 0 : episode.video.watched[0]?.percentage ?? 0,
                },
            ));
    }

    /**
   * @description Get the recently added media
   */
    getRecentlyAddedHomeScreen (ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: accessibleBy(ability, Action.Read).Media,
                    orderBy: {
                        updated: 'desc',
                    },
                    take: 20,
                }),
                'Error getting recently added media',
            )
            .map((media) => media.map(this.recommendationsService.toSlimMedia))
            .map(this.recommendationsService.buildBasicHomeResponse('recently added', 'recentlyAdded'));
    }

    /**
     * @description Get the trending media by type
     * @param type - The type of media to get
     * @param ability - The user's ability
     * @param language - The user's language
     */
    getTrendingMediaByType (type: MediaType, ability: AppAbilityType, language: LanguageReturn) {
        return this.getTrendingMedia(ability, language, type);
    }

    /**
     * @description Get the details of a collection by id
     * @param collectionId - The id of the collection
     * @param language - The user's language
     * @param ability - The user's ability
     */
    getCollectionById (collectionId: number, language: LanguageReturn, ability: AppAbilityType) {
        const performMap = (media: DetailedMedia[], collection: Collection) => {
            const collectionIds = collection.parts.map((part) => part.id);

            const internalMedia = sameOrder(collectionIds, media, 'tmdbId');

            return {
                name: collection.name,
                description: collection.overview,
                backdrop: collection.backdrop_path ? `https://image.tmdb.org/t/p/original${collection.backdrop_path}` : null,
                poster: collection.poster_path ? `https://image.tmdb.org/t/p/original${collection.poster_path}` : null,
                media: internalMedia,
            };
        };

        return TaskEither
            .tryCatch(
                () => this.tmdb.getCollection(collectionId, language.alpha2),
                'Error getting collection',
            )
            .chain((collection) => this.mapTmdbToSlimMedia(MediaType.MOVIE, collection.parts, ability)
                .chainArray((media) => media.map(this.getMediaDetails(language)))
                .map((media) => performMap(media, collection)));
    }

    /**
   * @description Get the appropriate item's id from a query
   * @param query - The query to search for
   * @param type - The type of the item
   */
    getIdFromQuery ({ query, type }: GetIdFromQueryArgs) {
        const searchPerson = TaskEither
            .tryCatch(
                () => this.prisma.credit.findFirst({
                    where: {
                        name: {
                            equals: query,
                            mode: 'insensitive',
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        tmdbId: true,
                    },
                }),
                'Error searching for person in database',
            )
            .nonNullable('Person not found')
            .map((result) => ({
                id: result.tmdbId.toString(),
                name: result.name,
            }));

        const searchCompany = TaskEither
            .tryCatch(
                () => this.prisma.company.findMany({
                    where: {
                        name: {
                            equals: query,
                            mode: 'insensitive',
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                }),
                'Error searching for company in database',
            )
            .map((results) => results[0])
            .nonNullable('Company not found');

        const searchCollection = TaskEither
            .tryCatch(
                () => this.tmdb.searchTmDB(query, {
                    library_type: 'COLLECTION',
                    include_adult: true,
                }),
                'Error searching for collection',
            )
            .map((results) => results.results)
            .map((results) => results.filter((result) => result.name.toLowerCase() === query.toLowerCase()))
            .map((results) => results[0])
            .nonNullable('Collection not found')
            .map((result) => ({
                id: result.id.toString(),
                name: result.name,
            }));

        return TaskEither
            .of(type)
            .matchTask([
                {
                    predicate: (type) => type === FinMediaTypes.PERSON,
                    run: () => searchPerson,
                },
                {
                    predicate: (type) => type === FinMediaTypes.COMPANY,
                    run: () => searchCompany,
                },
                {
                    predicate: (type) => type === FinMediaTypes.COLLECTION,
                    run: () => searchCollection,
                },
            ]);
    }

    /**
   * @description Get the recommendations for the home screen based on user's ability and activity
   * @param ability - The user's ability
   */
    getRecommendedHomeScreen (ability: AppAbilityType) {
        return this.recommendationsService.getRecommendedHomeScreen(ability);
    }

    private getGenres (genres: Genre[]) {
        if (genres.length === 0) {
            return 'Unknown';
        }

        if (genres.length === 1) {
            return genres[0].name;
        }

        const [first, second] = genres;

        if ((/&/g).test(first.name)) {
            return first.name;
        } else if ((/&/g).test(second.name)) {
            return second.name;
        }

        return `${first.name} & ${second.name}`;
    }

    private getTrailer (videos: AppendedVideos | undefined) {
        return videos?.results
            .find((video) => video.type === 'Trailer' && video.site === 'YouTube')?.key ?? null;
    }

    private getRating (release_dates: AppendedReleaseDates, lang: LanguageReturn) {
        const results = release_dates.results ?? [];
        const dates = results.filter((item) => item.iso_3166_1 === lang.countryCode || item.iso_3166_1 === lang.defaultObject().countryCode);
        const ratings = dates.flatMap((item) => item.release_dates).filter((item) => Boolean(item.certification));

        return ratings[0]?.certification ?? 'NR';
    }

    private getTvRating (lang: LanguageReturn, contentRatings: AppendedContentRatings) {
        const results = contentRatings.results ?? null;

        if (!results) {
            return 'NR';
        }

        const getRating = (value: string) => (ratings: ContentRatingsResult[]) => {
            const rating = ratings.find((item) => item.iso_3166_1 === value);

            if (rating) {
                return rating.rating;
            }

            return null;
        };

        return getRating(lang.countryCode)(results) ?? getRating(lang.defaultObject().countryCode)(results) ?? 'NR';
    }

    private buildMovieDetails (movie: Movie<PartialOptions>, lang: LanguageReturn) {
        const trailer = this.getTrailer(movie.videos);
        const genres = this.getGenres(movie.genres);
        const rating = this.getRating(movie.release_dates, lang);

        const details: MediaPartialDetails = {
            popularity: movie.popularity,
            genre: genres,
            trailer,
            overview: movie.overview,
            releaseDate: movie.release_date,
            rating,
        };

        return details;
    }

    private buildTvDetails (media: TVShow<PartialOptions>, lang: LanguageReturn) {
        const trailer = this.getTrailer(media.videos);
        const genres = this.getGenres(media.genres);
        const rating = this.getTvRating(lang, media.content_ratings);

        const details: MediaPartialDetails = {
            popularity: media.popularity,
            genre: genres,
            trailer,
            overview: media.overview,
            releaseDate: media.first_air_date,
            rating,
        };

        return details;
    }

    private getCredits (credits: AppendedCredits) {
        const actors: CastResponse[] = credits.cast
            .filter((actor) => actor.profile_path)
            .map((actor) => ({
                tmdbId: actor.id,
                name: actor.name,
                character: actor.character,
                profilePath: `https://image.tmdb.org/t/p/w500${actor.profile_path}`,
            }));

        const crew: CrewResponse[] = credits.crew
            .filter((crew) => crew.profile_path)
            .map((crew) => ({
                tmdbId: crew.id,
                name: crew.name,
                job: crew.job,
                profilePath: `https://image.tmdb.org/t/p/w500${crew.profile_path}`,
                department: crew.department,
            }));

        const directors = crew.filter((crew) => crew.job === 'Director');
        const writers = crew.filter((crew) => (/^Writer|Story|Screenplay$/i).test(crew.job));
        const producers = crew.filter((crew) => crew.job === 'Executive Producer');

        return {
            actors,
            directors,
            writers,
            producers,
        };
    }

    private getExtras (tmdbExtras: AppendedVideos): MediaExtras[] {
        return tmdbExtras.results
            .filter((video) => video.site === 'YouTube' && video.type !== 'Trailer')
            .map((video) => ({
                youtubeId: video.key,
                name: video.name,
                publishedAt: video.published_at,
                type: video.type as VideoType,
                thumbnail: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
            }));
    }

    private getRuntime (runtime: number) {
        const interval = intervalToDuration({
            start: 0,
            end: runtime * 60 * 1000,
        });
        const hours = interval.hours && interval.hours > 0 ? `${interval.hours}h ` : '';
        const minutes = interval.minutes && interval.minutes > 0 ? `${interval.minutes}m` : '';

        return `${hours}${minutes}`;
    }

    private getCollection (collection: Collection | null) {
        if (collection) {
            return {
                tmdbId: collection.id,
                name: collection.name,
            };
        }

        return null;
    }

    private getShowStatus (first_air_date: Date, last_air_date: Date, status: string) {
        return Either
            .of(status)
            .match([
                {
                    predicate: (status) => status === 'Ended',
                    run: () => {
                        const startY = first_air_date?.getFullYear();
                        const endY = last_air_date.getFullYear();

                        if (startY === endY) {
                            return `${startY}`;
                        }

                        return `${startY} - ${endY}`;
                    },
                },
                {
                    predicate: (status) => status === 'Returning Series',
                    run: () => `${first_air_date?.getFullYear()} - Present`,
                },
                {
                    predicate: (status) => status === 'Canceled',
                    run: () => {
                        const startY = first_air_date?.getFullYear();
                        const endY = last_air_date.getFullYear();

                        if (startY === endY) {
                            return `${startY}`;
                        }

                        return `${startY} - ${endY}, Canceled`;
                    },
                },
            ])
            .toNullable() ?? status;
    }

    private getSeasons (tmdbSeasons: BaseSeason[], seasons: Episode[], backdrop: string): SeasonResponse[] {
        const groupedSeasons = sortBy(groupBy(seasons, 'season'), 'key', 'asc');

        return groupedSeasons.map((season) => {
            const tmdbEpisodes = tmdbSeasons.find((tmdbSeason) => tmdbSeason.season_number === season.key)?.episodes ?? [];
            const seasonNumber = season.key;
            const episodes = sortBy(season.values, 'episode', 'asc')
                .map((episode) => {
                    const tmdbEpisode = tmdbEpisodes.find(
                        (tmdbEpisode) => tmdbEpisode.episode_number === episode.episode,
                    );

                    if (!tmdbEpisode) {
                        return null;
                    }

                    const newPhotoBackdrop = tmdbEpisode.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEpisode.still_path}` : `/api/playback/${episode.videoId}/0/240p/30`;

                    return {
                        id: episode.id,
                        name: tmdbEpisode.name,
                        overview: tmdbEpisode.overview,
                        season: tmdbEpisode.season_number,
                        episode: tmdbEpisode.episode_number,
                        photo: newPhotoBackdrop,
                        showId: episode.showId,
                        videoId: episode.videoId,
                    };
                })
                .filter((episode) => episode) as EpisodeResponse[];

            return {
                season: seasonNumber,
                episodes,
            };
        });
    }

    private getCompanies (companies: { company: Company }[]): CompanyResponse[] {
        return companies.map((company) => ({
            id: company.company.id,
            name: company.company.name,
            logo: company.company.logo,
            type: company.company.type,
        }));
    }

    private getMovieById (mediaId: string, ability: AppAbilityType, language: LanguageReturn) {
        const getData = (tmdbId: number) => TaskEither.tryCatch(
            () => this.tmdb.getMovie(tmdbId, {
                language: language.alpha2,
                append_to_response: {
                    credits: true,
                    videos: true,
                    content_ratings: true,
                    external_ids: true,
                    collection: true,
                    release_dates: true,
                },
            }),
            'Error getting movie details',
        )
            .map((tmdbMedia) => {
                const credits = this.getCredits(tmdbMedia.credits);
                const extras = this.getExtras(tmdbMedia.videos);
                const runtime = this.getRuntime(tmdbMedia.runtime);
                const details = this.buildMovieDetails(tmdbMedia, language);
                const collection = this.getCollection(tmdbMedia.collection);

                return {
                    ...details,
                    ...credits,
                    extras,
                    runtime,
                    collection,
                    voteAverage: tmdbMedia.vote_average,
                    originalCollection: tmdbMedia.collection,
                };
            })
            .chain(({ originalCollection, ...details }) => this.recommendationsService.getMediaRecommendations(mediaId, tmdbId, ability, originalCollection)
                .map((recommendations) => ({
                    ...details,
                    recommendations,
                })));

        return TaskEither
            .tryCatch(
                () => this.prisma.media.findFirst({
                    where: {
                        AND: [
                            {
                                id: mediaId,
                            },
                            {
                                type: MediaType.MOVIE,
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    include: {
                        episodes: true,
                        videos: true,
                        companies: {
                            include: {
                                company: true,
                            },
                        },
                    },
                }),
                'Error getting media by id',
            )
            .nonNullable('Media not found')
            .chain((media) => {
                const tmdbMedia = getData(media.tmdbId);
                const companies = TaskEither.of(this.getCompanies(media.companies));
                const slimMedia = TaskEither.of(this.recommendationsService.toSlimMedia(media));

                return TaskEither
                    .fromBind({
                        tmdbMedia,
                        slimMedia,
                        companies,
                    })
                    .map(
                        ({
                            tmdbMedia: { recommendations, ...rest },
                            slimMedia,
                            companies,
                        }): MediaResponse & { recommended: boolean } => ({
                            ...rest,
                            ...slimMedia,
                            companies,
                            seasons: [],
                            mediaStatus: null,
                            genres: media.genres,
                            recommended: recommendations.recommended,
                            recommendations: recommendations.media,
                            sections: [],
                        }),
                    );
            });
    }

    private getShowById (mediaId: string, ability: AppAbilityType, language: LanguageReturn) {
        const getRuntimeNumber = (season: BaseSeason[]): number => season
            .flatMap((season) => season.episodes)
            .map((episode) => episode.runtime)
            .filter((runtime) => runtime)[0] ?? 0;

        const getData = (tmdbId: number, episodes: Episode[], backdrop: string) => TaskEither
            .tryCatch(
                () => this.tmdb.getShow(tmdbId, {
                    language: language.alpha2,
                    append_to_response: {
                        credits: true,
                        videos: true,
                        appendSeasons: 'all',
                        content_ratings: true,
                        external_ids: true,
                        collection: true,
                        release_dates: true,
                    },
                }),
                'Error getting movie details',
            )
            .map((tmdbMedia) => {
                const credits = this.getCredits(tmdbMedia.credits);
                const extras = this.getExtras(tmdbMedia.videos);
                const runtime = this.getRuntime(getRuntimeNumber(tmdbMedia.appendSeasons ?? []));
                const status = this.getShowStatus(tmdbMedia.first_air_date, tmdbMedia.last_air_date, tmdbMedia.status);
                const details = this.buildTvDetails(tmdbMedia, language);
                const seasons = this.getSeasons(tmdbMedia.appendSeasons ?? [], episodes, backdrop);

                return {
                    ...credits,
                    ...details,
                    voteAverage: tmdbMedia.vote_average,
                    runtime,
                    extras,
                    seasons,
                    collection: null,
                    name: tmdbMedia.name,
                    type: MediaType.SHOW,
                    tmdbId: tmdbMedia.id,
                    mediaStatus: status,
                };
            });

        return TaskEither
            .tryCatch(
                () => this.prisma.media.findFirst({
                    where: {
                        AND: [
                            {
                                id: mediaId,
                            },
                            {
                                type: MediaType.SHOW,
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    include: {
                        episodes: true,
                        videos: {
                            include: {
                                episode: true,
                            },
                        },
                        companies: {
                            include: {
                                company: true,
                            },
                        },
                    },
                }),
                'Error getting media by id',
            )
            .nonNullable('Media not found')
            .chain((media) => {
                const recommendations = this.recommendationsService.getMediaRecommendations(mediaId, media.tmdbId, ability);
                const slimMedia = TaskEither.of(this.recommendationsService.toSlimMedia(media));
                const tmdbMedia = getData(media.tmdbId, media.episodes, media.backdrop);
                const companies = TaskEither.of(this.getCompanies(media.companies));

                return TaskEither
                    .fromBind({
                        tmdbMedia,
                        recommendations,
                        slimMedia,
                        companies,
                    })
                    .map(
                        ({
                            tmdbMedia,
                            slimMedia,
                            companies,
                            recommendations,
                        }): MediaResponse & { recommended: boolean } => ({
                            ...tmdbMedia,
                            ...slimMedia,
                            companies,
                            genres: media.genres,
                            recommended: recommendations.recommended,
                            recommendations: recommendations.media,
                            sections: [],
                        }),
                    );
            });
    }

    private manageMediaSections ({ recommended, ...media }: MediaResponse & { recommended: boolean }): MediaResponse {
        if (recommended) {
            media.sections = [MediaSection.MORE_LIKE_THIS];
        } else {
            media.sections = [MediaSection.MOST_RELEVANT];
        }

        if (media.seasons.length === 1 && media.seasons[0].season === 1) {
            media.sections = [MediaSection.EPISODES, ...media.sections];
        } else if (media.seasons.length >= 1) {
            media.sections = [MediaSection.SEASONS, ...media.sections];
        }

        if (media.extras.length > 0) {
            media.sections = [...media.sections, MediaSection.EXTRAS];
        }

        media.sections.push(MediaSection.DETAILS);

        return media;
    }

    private getPopularMedia (language: LanguageReturn, ability: AppAbilityType) {
        const popular = (type: MediaType) => TaskEither
            .tryCatch(
                () => this.tmdb.getPopularMedia({
                    language: language.alpha2,
                    library_type: type,
                }),
                'Error getting popular media',
            )
            .chain((media) => this.mapTmdbToSlimMedia(type, media.results, ability));

        return TaskEither.of([MediaType.MOVIE, MediaType.SHOW])
            .chainItems(popular)
            .map((x) => x.flat())
            .sortBy('popularity', 'desc');
    }

    private getTopRatedMedia (language: LanguageReturn, ability: AppAbilityType) {
        const topRated = (type: MediaType) => TaskEither
            .tryCatch(
                () => this.tmdb.getTopRatedMedia({
                    language: language.alpha2,
                    library_type: type,
                }),
                'Error getting top rated media',
            )
            .chain((media) => this.mapTmdbToSlimMedia(type, media.results, ability));

        return TaskEither.of([MediaType.MOVIE, MediaType.SHOW])
            .chainItems(topRated)
            .map((x) => x.flat())
            .sortBy('popularity', 'desc');
    }

    private getTrendingMedia (ability?: AppAbilityType, language?: LanguageReturn, type?: MediaType) {
        const types = type ? [type] : [MediaType.MOVIE, MediaType.SHOW];

        const getTrending = (type: MediaType) => (time: 'day' | 'week') => TaskEither
            .tryCatch(
                () => this.tmdb.getTrendingMedia({
                    language: language?.alpha2 ?? this.languageService.defaultLanguage.alpha2,
                    library_type: type,
                    time_window: time,
                }),
                'Error getting trending media',
            )
            .chain((media) => this.mapTmdbToSlimMedia(type, media.results, ability));

        const trending = (type: MediaType) => TaskEither
            .of(['day', 'week'])
            .chainItems(getTrending(type))
            .map((x) => x.flat())
            .distinct('id');

        return TaskEither
            .of(types)
            .chainItems(trending)
            .map((x) => x.flat())
            .sortBy('popularity', 'desc');
    }

    private getAiringToday (language: LanguageReturn, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.tmdb.getAiringShows({
                    language: language.alpha2,
                }),
                'Error getting airing today',
            )
            .chain((media) => this.mapTmdbToSlimMedia(MediaType.SHOW, media.results, ability));
    }

    private getNowPlayingMovies (language: LanguageReturn, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.tmdb.getNowPlayingMovies({
                    language: language.alpha2,
                }),
                'Error getting now playing movies',
            )
            .chain((media) => this.mapTmdbToSlimMedia(MediaType.MOVIE, media.results, ability));
    }

    private mapTmdbToSlimMedia (type: MediaType, media: (MiniMovie | MiniTVShow)[], ability?: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findMany({
                    where: {
                        AND: [
                            {
                                tmdbId: {
                                    'in': media.map((m) => m.id),
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
            )
            .mapItems(this.recommendationsService.toSlimMedia)
            .intersect(media, 'tmdbId', 'id', 'popularity')
            .sortBy('popularity', 'desc');
    }
}
