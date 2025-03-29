import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import {
    createBadRequestError,
    createUnauthorizedError,
    Either,
    sortBy,
    TaskEither,
    createNotFoundError,
} from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { AccessPolicy, Episode, Media, Role, User } from '@prisma/client';
import { UsernameParams } from '../authentication/auth.contracts';
import { LanguageService } from '../language/language.service';
import { LanguageReturn } from '../language/language.types';
import { RecommendationsService } from '../media/recommendations.service';
import { RetrieveService } from '../misc/retrieve.service';
import { NotificationService } from '../notifications/notification.service';
import { COMPLETED_VIDEO_POSITION } from '../playback/playback.constants';
import { PrismaService } from '../prisma/prisma.service';
import { RatedStatus } from '../rating/rating.contracts';
import { SeenResponse } from '../seen/seen.contracts';
import { CachedSession } from '../session/session.contracts';
import { SessionService } from '../session/session.service';
import { mapPageResponse } from '../utils/helper.fp';
import { PageResponse, PaginateArgs, HomeResponseTypes } from '../utils/utils.contracts';

import { GetActivityArgs, UpdateUserArgs } from './user.args';
import { ContinueWatchingItem, HistorySchema, HistoryType, SlimFrontUser, UserMediaDetails } from './user.schema';


@Injectable()
export class UsersService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly sessionService: SessionService,
        private readonly retrieveService: RetrieveService,
        private readonly languageService: LanguageService,
        private readonly notificationService: NotificationService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @desc Find user by email
     * @param email - email of the user
     * @param validateAccount - whether to validate the account
     */
    findByEmail (email: string, validateAccount = true) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({ where: { email } }),
                'Failed to find user by email',
            )
            .nonNullable('User not found')
            .chain(this.validateAccount(validateAccount));
    }

    /**
     * @desc Find user by username
     * @param username - username of the user
     */
    findByUsername (username: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({ where: { username } }),
                'Failed to find user by username',
            )
            .nonNullable('User not found')
            .chain(this.validateAccount());
    }

    /**
     * @desc Find user by the confirmation token used to verify the email
     * @param confirmToken - token used to verify the email
     */
    findByToken (confirmToken: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findFirst({ where: { confirmToken } }),
                'Failed to find user by token',
            )
            .nonNullable('User not found');
    }

    /**
     * @desc Get details of the media for the user
     * @param media - media to get details for
     * @param user - user to get details for
     */
    getMediaDetails (media: Media, user: User) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        lists: {
                            where: { mediaId: media.id },
                        },
                        watched: {
                            where: { mediaId: media.id },
                        },
                        seenMedia: {
                            where: { mediaId: media.id },
                        },
                        ratings: {
                            where: { mediaId: media.id },
                        },
                        groups: {
                            where: {
                                group: {
                                    policy: {
                                        some: {
                                            mediaGroup: {
                                                media: {
                                                    some: {
                                                        id: media.id,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            include: {
                                group: {
                                    select: {
                                        policy: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Failed to get media details',
            )
            .nonNullable('User not found')
            .map((user): UserMediaDetails => {
                const isInList = user.lists.length > 0;
                const rating = user.ratings[0]?.rate
                    ? user.ratings[0].rate
                        ? RatedStatus.POSITIVE
                        : RatedStatus.NEGATIVE
                    : RatedStatus.NONE;

                const seen: SeenResponse = {
                    hasSeen: user.seenMedia.length > 0,
                    videosSeen: user.watched.map((video) => ({
                        videoId: video.videoId,
                        percentage: video.percentage,
                    })),
                };

                const canModify = user.groups.flatMap((group) => group.group.policy)
                    .some(({ access }) => access === AccessPolicy.UPDATE || access === AccessPolicy.WRITE) || user.role === Role.ADMIN;

                return {
                    isInList,
                    rating,
                    seen,
                    canModify,
                };
            });
    }

    /**
     * @desc Update the user's language setting
     * @param user - user to update
     * @param language - language to update to
     */
    updateLanguage (user: User, language: LanguageReturn) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.update({
                    where: { id: user.id },
                    data: { defaultLang: language.languageName },
                }),
                'Failed to update language',
            )
            .chain(() => this.sessionService.updateSession(user));
    }

    /**
     * @desc Update the user's profile
     * @param user - user to update
     * @param updateUserArgs - arguments to update the user
     */
    updateUserData (user: User, updateUserArgs: UpdateUserArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.update({
                    where: { id: user.id },
                    data: updateUserArgs,
                }),
                'Failed to update incognito',
            )
            .chain((user) => this.sessionService.updateSession(user));
    }

    /**
     * @desc Update the user's username
     * @param user - user to update
     * @param params - parameters to update the username
     */
    updateUsername (user: User, params: UsernameParams) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({ where: { username: params.username } }),
                'Failed to find user',
            )
            .flip(
                () => TaskEither.of(user),
                () => createBadRequestError('Username already exists'),
            )
            .chain(() => TaskEither
                .tryCatch(
                    () => this.prisma.user.update({
                        where: { id: user.id },
                        data: { username: params.username },
                    }),
                    'Failed to update username',
                ));
    }

    /**
     * @desc Get the user's list of currently watching media
     * @param user - user to get the list for
     * @param ability - ability to check the user's permissions
     * @param language - language to get the media in
     */
    getContinueWatching (user: User, ability: AppAbilityType, language: LanguageReturn) {
        const buildContinueWatching = (videoId: string, percentage: number, media: Media, episode: Episode | null) => this.recommendationsService.getTmdbVideoDetails(media, language, episode)
            .map((video): ContinueWatchingItem => ({
                ...this.recommendationsService.toSlimMedia(media),
                backdrop: video.episodeBackdrop ?? media.backdrop,
                percentage,
                videoId,
            }));

        const performAction = (videoId: string, percentage: number, media: Media, episode: Episode | null) => TaskEither
            .of(episode)
            .matchTask([
                {
                    predicate: (episode) => episode === null || percentage < COMPLETED_VIDEO_POSITION,
                    run: () => buildContinueWatching(videoId, percentage, media, episode),
                },
                {
                    predicate: (episode) => episode !== null && percentage >= COMPLETED_VIDEO_POSITION,
                    run: () => this.recommendationsService.getVideoFromMedia(media, ability)
                        .filter(
                            ({ isLastEpisode }) => !isLastEpisode,
                            () => createNotFoundError('No more episodes available'),
                        )
                        .chain((response) => buildContinueWatching(response.id, response.percentage, media, response.episode)),
                }
            ])

        return TaskEither
            .tryCatch(
                () => this.prisma.watched.findMany({
                    where: {
                        AND: [
                            { userId: user.id },
                            {
                                media: {
                                    AND: [
                                        accessibleBy(ability, Action.Read).Media,
                                        {
                                            videos: {
                                                some: {
                                                    OR: [
                                                        {
                                                            watched: {
                                                                none: {
                                                                    userId: user.id,
                                                                },
                                                            },
                                                        },
                                                        {
                                                            watched: {
                                                                some: {
                                                                    userId: user.id,
                                                                    percentage: { lt: COMPLETED_VIDEO_POSITION },
                                                                },
                                                            },
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                },
                            },
                        ],
                    },
                    distinct: ['mediaId'],
                    include: {
                        video: {
                            include: {
                                media: true,
                                episode: true,
                            },
                        },
                    },
                    take: 20,
                    orderBy: {
                        updated: 'desc',
                    },
                }),
                'Failed to get continue watching',
            )
            .chainItems((watched) => performAction(watched.videoId, watched.percentage, watched.video.media, watched.video.episode))
            .filterItems((item) => item.percentage < COMPLETED_VIDEO_POSITION)
            .map(this.recommendationsService.buildHomeResponse('Continue where you left off', 'continue-watching', HomeResponseTypes.CONTINUE_WATCHING));
    }

    /**
     * @desc Get the user's streaming session if the user is currently streaming
     * @param session - session to get the streaming session for
     */
    getStreamingSession (session: CachedSession) {
        return this.notificationService.getMetadata(session)
            .chain(([first]) => TaskEither.fromNullable(first));
    }

    /**
     * @desc Generate media recommendations for the user
     * @param ability - ability to check the user's permissions
     */
    getRecommendations (ability: AppAbilityType) {
        return this.recommendationsService.getUserRecommendations(ability);
    }

    /**
     * @desc Revoke access to the user
     * @param user - user revoking access
     * @param userIds - ids of the users to revoke access for
     */
    revokeUsersAccess (user: User, userIds: string[]) {
        return this.safeUsers(user, userIds)
            .chain(({ userIds, email }) => TaskEither
                .tryCatch(
                    () => this.prisma.user.updateMany({
                        where: {
                            AND: [
                                { id: { 'in': userIds } },
                                { email: { not: email } },
                            ],
                        },
                        data: { revoked: true },
                    }),
                    'Failed to revoke users access',
                ).map(() => userIds))
            .chainItems((userId) => this.sessionService.removeUserSessions(userId))
            .map(() => ({
                message: 'Users access revoked',
            }));
    }

    /**
     * @desc Promote users to a specific role
     * @param user - user promoting the users
     * @param userIds - ids of the users to promote
     * @param role - role to promote the users to
     */
    promoteUsers (user: User, userIds: string[], role: Role) {
        return this.safeUsers(user, userIds)
            .chain(({ userIds, email }) => TaskEither
                .tryCatch(
                    () => this.prisma.user.updateMany({
                        where: {
                            AND: [
                                { id: { 'in': userIds } },
                                { email: { not: email } },
                            ],
                        },
                        data: { role },
                    }),
                    'Failed to promote users',
                ).map(() => userIds))
            .chainItems((userId) => this.sessionService.removeUserSessions(userId))
            .map(() => ({
                message: `Users promoted to ${role}`,
            }));
    }

    /**
     * @desc Grant users access
     * @param user - user granting access
     * @param userIds - ids of the users to grant access to
     */
    grantUsersAccess (user: User, userIds: string[]) {
        return this.safeUsers(user, userIds)
            .chain(({ userIds, email }) => TaskEither
                .tryCatch(
                    () => this.prisma.user.updateMany({
                        where: {
                            AND: [
                                { id: { 'in': userIds } },
                                { email: { not: email } },
                            ],
                        },
                        data: { revoked: false },
                    }),
                    'Failed to grant users access',
                ))
            .map(() => ({
                message: 'Users access granted',
            }));
    }

    /**
     * @desc Delete users
     * @param user - user deleting the users
     * @param userIds - ids of the users to delete
     */
    deleteUsers (user: User, userIds: string[]) {
        return this.safeUsers(user, userIds)
            .chain(({ userIds, email }) => TaskEither
                .tryCatch(
                    () => this.prisma.user.deleteMany({
                        where: {
                            AND: [
                                { id: { 'in': userIds } },
                                { email: { not: email } },
                            ],
                        },
                    }),
                    'Failed to delete users',
                ).map(() => userIds))
            .chainItems((userId) => this.sessionService.removeUserSessions(userId))
            .map(() => ({
                message: 'Users deleted',
            }));
    }

    /**
     * @desc Delete items from the user's list
     * @param user - user deleting the items
     * @param itemIds - ids of the items to delete
     */
    deleteItems (user: User, itemIds: string[]) {
        const deleteList = TaskEither
            .tryCatch(
                () => this.prisma.listItem.deleteMany({
                    where: {
                        id: { 'in': itemIds },
                        userId: user.id,
                    },
                }),
                'Failed to delete list items',
            );

        const deleteWatched = TaskEither
            .tryCatch(
                () => this.prisma.watched.deleteMany({
                    where: {
                        id: { 'in': itemIds },
                        userId: user.id,
                    },
                }),
                'Failed to delete watched items',
            );

        const deleteRatings = TaskEither
            .tryCatch(
                () => this.prisma.rating.deleteMany({
                    where: {
                        id: { 'in': itemIds },
                        userId: user.id,
                    },
                }),
                'Failed to delete ratings',
            );

        return TaskEither
            .all(deleteList, deleteWatched, deleteRatings)
            .map(() => ({
                message: 'Items deleted',
            }));
    }

    /**
     * @desc Confirm users
     * @param user - user confirming the users
     * @param userIds - ids of the users to confirm
     */
    confirmUsers (user: User, userIds: string[]) {
        return this.safeUsers(user, userIds)
            .chain(({ userIds, email }) => TaskEither
                .tryCatch(
                    () => this.prisma.user.updateMany({
                        where: {
                            AND: [
                                { id: { 'in': userIds } },
                                { email: { not: email } },
                            ],
                        },
                        data: {
                            confirmedEmail: true,
                            confirmToken: null,
                        },
                    }),
                    'Failed to confirm users',
                ))
            .map(() => ({
                message: 'Users confirmed',
            }));
    }

    /**
     * @desc Get users
     * @param paginated - pagination arguments
     */
    getUsers (paginated: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.paginate({
                    paginate: paginated,
                    include: {
                        _count: {
                            select: {
                                lists: true,
                                watched: true,
                                seenMedia: true,
                                ratings: true,
                                groups: true,
                            },
                        },
                    },
                    where: {
                        role: {
                            not: Role.GUEST,
                        },
                    },
                }),
                'Failed to get users',
            )
            .map(mapPageResponse((user): SlimFrontUser => ({
                userId: user.id,
                username: user.username,
                watched: user._count.watched,
                rated: user._count.ratings,
                lists: user._count.lists,
                created: user.created.toISOString(),
                email: user.email,
                role: user.role,
                seen: user._count.seenMedia,
                userGroups: user._count.groups,
                playlists: user._count.lists,
                revoked: user.revoked,
                confirmed: user.confirmedEmail,
            })));
    }

    /**
     * @desc Get the user's profile details
     * @param session - session to get the profile details for
     */
    getProfileDetails (session: CachedSession) {
        return {
            email: session.user.email,
            username: session.user.username,
            autoplay: session.user.autoplay,
            incognito: session.user.incognito,
            inform: session.user.inform,
            language: session.user.defaultLang,
            availableLanguages: this.languageService.getAvailableLanguages(),
        };
    }

    /**
     * @desc Get the user's activity
     * @param user - user to get the activity for
     * @param query - query to search for
     * @param type - types of activity to get
     * @param paginate - pagination arguments
     */
    getActivity (user: User, { query, type = [], ...paginate }: GetActivityArgs) {
        const positive = TaskEither
            .tryCatch(
                () => this.prisma.rating.paginate({
                    paginate,
                    where: {
                        userId: user.id,
                        rate: true,
                        media: query
                            ? {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                    },
                    orderBy: {
                        updated: 'desc',
                    },
                    include: {
                        media: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                poster: true,
                                posterBlur: true,
                            },
                        },
                    },
                }),
                'Failed to get positive ratings',
            )
            .map(mapPageResponse((rating): HistorySchema => ({
                id: rating.id,
                media: rating.media,
                type: HistoryType.RATED_POSITIVE,
                date: rating.updated.toISOString(),
            })));

        const negative = TaskEither
            .tryCatch(
                () => this.prisma.rating.paginate({
                    paginate,
                    where: {
                        userId: user.id,
                        rate: false,
                        media: query
                            ? {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                    },
                    orderBy: {
                        updated: 'desc',
                    },
                    include: {
                        media: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                poster: true,
                                posterBlur: true,
                            },
                        },
                    },
                }),
                'Failed to get positive ratings',
            )
            .map(mapPageResponse((rating): HistorySchema => ({
                id: rating.id,
                media: rating.media,
                type: HistoryType.RATED_NEGATIVE,
                date: rating.updated.toISOString(),
            })));

        const addedToList = TaskEither
            .tryCatch(
                () => this.prisma.listItem.paginate({
                    paginate,
                    where: {
                        userId: user.id,
                        media: query
                            ? {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                    },
                    orderBy: {
                        updated: 'desc',
                    },
                    include: {
                        media: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                poster: true,
                                posterBlur: true,
                            },
                        },
                    },
                }),
                'Failed to get added to list',
            )
            .map(mapPageResponse((list): HistorySchema => ({
                id: list.id,
                media: list.media,
                type: HistoryType.ADDED_TO_WATCHLIST,
                date: list.updated.toISOString(),
            })));

        const watched = TaskEither
            .tryCatch(
                () => this.prisma.watched.paginate({
                    paginate,
                    where: {
                        userId: user.id,
                        media: query
                            ? {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                    },
                    orderBy: {
                        updated: 'desc',
                    },
                    include: {
                        media: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                poster: true,
                                posterBlur: true,
                            },
                        },
                        episode: true,
                    },
                }),
                'Failed to get watched',
            )
            .map(mapPageResponse((watched): HistorySchema => ({
                id: watched.id,
                type: HistoryType.WATCHED,
                date: watched.updated.toISOString(),
                media: {
                    ...watched.media,
                    episode: watched.episode?.episode || undefined,
                    season: watched.episode?.season || undefined,
                    videoId: watched.videoId,
                },
            })));

        const tasks = [
            {
                type: HistoryType.RATED_POSITIVE,
                task: positive,
            },
            {
                type: HistoryType.RATED_NEGATIVE,
                task: negative,
            },
            {
                type: HistoryType.ADDED_TO_WATCHLIST,
                task: addedToList,
            },
            {
                type: HistoryType.WATCHED,
                task: watched,
            },
        ];

        const tasksToRun = tasks.filter(({ type: t }) => type.includes(t) || type.length === 0).map(({ task }) => task);

        const pageResponse = TaskEither
            .all(...tasksToRun)
            .map(([first, ...rest]): PageResponse<HistorySchema> => ({
                page: first?.page ?? 1,
                results: [first?.results ?? [], ...rest.map((r) => r.results)].flat(),
                totalPages: sortBy([first, ...rest], 'totalPages', 'desc')[0]?.totalPages ?? 1,
                totalResults: [first, ...rest].reduce((acc, { totalResults }) => acc + totalResults, 0),
            }));

        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        _count: {
                            select: {
                                ratings: {
                                    where: {
                                        media: query ? { name: { contains: query } } : {},
                                    },
                                },
                                lists: {
                                    where: {
                                        media: query ? { name: { contains: query } } : {},
                                    },
                                },
                                watched: {
                                    where: {
                                        media: query ? { name: { contains: query } } : {},
                                    },
                                },
                            },
                        },
                    },
                }),
            )
            .nonNullable('User not found')
            .map(({ _count }): number => _count.ratings + _count.lists + _count.watched)
            .chain((totalResults) => pageResponse
                .map((page): PageResponse<HistorySchema> => ({
                    ...page,
                    totalResults,
                })));
    }

    private validateAccount<T extends User> (validateAccount = true) {
        return (user: T) => Either.of(user)
            .filter(
                (user) => user.confirmedEmail || !validateAccount,
                () => createUnauthorizedError('Email not confirmed'),
            )
            .filter(
                (user) => !user.revoked || !validateAccount,
                () => createUnauthorizedError('Account revoked'),
            )
            .toTaskEither();
    }

    private safeUsers (user: User, userIds: string[]) {
        const otherUsers = userIds.filter((id) => id !== user.id);

        return this.retrieveService.adminEmail
            .map((email) => ({
                userIds: otherUsers,
                email,
            }))
            .filter(
                ({ userIds }) => userIds.length > 0,
                () => createBadRequestError('No users to perform action on'),
            );
    }
}
