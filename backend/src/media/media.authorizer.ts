import { accessibleBy } from '@casl/prisma';
import {
    WillAuthorize,
    Authorizer,
    RuleBuilder,
    Action,
    AppAbilityType,
    Permission,
    sortActions, AuthorizationContext,
} from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { AccessPolicy, Episode, Media, Role, User } from '@prisma/client';
import { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';

@Authorizer()
export class MediaAuthorizer implements WillAuthorize {
    constructor (private readonly prisma: PrismaService) {}

    static getQuery (user: User, policy: AccessPolicy) {
        if (policy === AccessPolicy.READ) {
            return MediaAuthorizer.readQuery(user);
        }

        if (policy === AccessPolicy.DELETE) {
            return MediaAuthorizer.deleteQuery(user);
        }

        if (user.role === Role.ADMIN) {
            return MediaAuthorizer.readQuery(user);
        }

        return MediaAuthorizer.baseQuery(user, policy);
    }

    private static readQuery (user: User) {
        return {
            OR: [
                {
                    groups: {
                        none: {},
                    },
                },
                {
                    AND: [
                        {
                            groups: {
                                some: {
                                    policy: {
                                        some: {
                                            AND: [
                                                {
                                                    NOT: {
                                                        access: AccessPolicy.DENY,
                                                    },
                                                },
                                                {
                                                    userGroup: {
                                                        users: {
                                                            some: {
                                                                userId: user.id,
                                                            },
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            groups: {
                                none: {
                                    policy: {
                                        some: {
                                            AND: [
                                                {
                                                    access: AccessPolicy.DENY,
                                                },
                                                {
                                                    userGroup: {
                                                        users: {
                                                            some: {
                                                                userId: user.id,
                                                            },
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    }

    private static deleteQuery (user: User) {
        return {
            OR: [
                {
                    videos: {
                        every: {
                            cloudStorage: {
                                userId: user.id,
                            },
                        },
                    },
                },
                MediaAuthorizer.baseQuery(user, AccessPolicy.DELETE),
            ],
        };
    }

    private static baseQuery (user: User, policy: AccessPolicy) {
        return {
            AND: [
                {
                    groups: {
                        some: {
                            policy: {
                                some: {
                                    AND: [
                                        {
                                            access: policy,
                                        },
                                        {
                                            userGroup: {
                                                users: {
                                                    some: {
                                                        userId: user.id,
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    groups: {
                        none: {
                            policy: {
                                some: {
                                    AND: [
                                        {
                                            access: AccessPolicy.DENY,
                                        },
                                        {
                                            userGroup: {
                                                users: {
                                                    some: {
                                                        userId: user.id,
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            ],
        };
    }

    forUser (user: User, { can }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            return;
        }

        if (user.role === Role.SYSTEM) {
            can(Action.Manage, 'Media');
        }

        can(Action.Read, 'Media', MediaAuthorizer.getQuery(user, AccessPolicy.READ));
        can(Action.Update, 'Media', MediaAuthorizer.getQuery(user, AccessPolicy.UPDATE));
        can(Action.Delete, 'Media', MediaAuthorizer.getQuery(user, AccessPolicy.DELETE));
    }

    authorize (context: AuthorizationContext, ability: AppAbilityType, rules: Permission[]) {
        if (context.isSocket) {
            return TaskEither.of(true);
        }

        const request = context.getRequest<{ media: Media, episode: Episode }>();
        const mediaId = request.params.mediaId;
        const episodeId = request.params.episodeId;
        const mediaRules = rules.filter((rule) => rule.resource === 'Media');

        if (mediaId === undefined && episodeId === undefined) {
            return TaskEither.of(true);
        }

        const [leastPermissiveAction] = sortActions(mediaRules.map((rule) => rule.action)) ?? [Action.Read];

        return TaskEither
            .of({
                mediaId,
                episodeId,
            })
            .matchTask([
                {
                    predicate: ({ mediaId }) => mediaId !== undefined,
                    run: ({ mediaId }) => this.readMedia(mediaId, ability, leastPermissiveAction, request),
                },
                {
                    predicate: ({ episodeId }) => episodeId !== undefined,
                    run: ({ episodeId }) => this.readEpisode(episodeId, ability, leastPermissiveAction, request),
                },
            ]);
    }

    private readMedia (mediaId: string, ability: AppAbilityType, action: Action, request: Request & { media: Media }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findFirst({
                    where: {
                        AND: [
                            accessibleBy(ability, action).Media,
                            {
                                id: mediaId,
                            },
                        ],
                    },
                }),
                'Failed to find media by id',
            )
            .nonNullable('Media not found')
            .map((media) => {
                request.media = media;

                return true;
            });
    }

    private readEpisode (episodeId: string, ability: AppAbilityType, action: Action, request: Request & { episode: Episode }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.episode.findFirst({
                    where: {
                        AND: [
                            {
                                id: episodeId,
                            },
                            {
                                media: accessibleBy(ability, action).Media,
                            },
                        ],
                    },
                }),
                'Failed to find episode by id',
            )
            .nonNullable('Episode not found')
            .map((episode) => {
                request.episode = episode;

                return true;
            });
    }
}
