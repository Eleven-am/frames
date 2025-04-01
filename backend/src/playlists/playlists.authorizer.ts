import { accessibleBy } from '@casl/prisma';
import {
    WillAuthorize,
    Authorizer,
    sortActions,
    RuleBuilder,
    Action,
    AppAbilityType,
    Permission, AuthorizationContext,
} from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { AccessPolicy, Role, User, Playlist, PlaylistVideo } from '@prisma/client';
import { Request } from 'express';

import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';

@Authorizer()
export class PlaylistsAuthorizer implements WillAuthorize {
    constructor (private readonly prisma: PrismaService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail || user.role === Role.GUEST) {
            cannot(Action.Manage, 'Playlist').because('User is not authorised to access the Playlist resource');

            return;
        }

        can(Action.Create, 'Playlist');

        can(Action.Read, 'Playlist', {
            OR: [
                {
                    userId: user.id,
                },
                {
                    isPublic: true,
                },
                {
                    sharedUsers: {
                        some: {
                            AND: [
                                {
                                    userId: user.id,
                                },
                                {
                                    NOT: {
                                        access: AccessPolicy.DENY,
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        });

        can(Action.Update, 'Playlist', {
            OR: [
                {
                    userId: user.id,
                },
                {
                    sharedUsers: {
                        some: {
                            userId: user.id,
                            access: {
                                'in': [AccessPolicy.UPDATE, AccessPolicy.DELETE],
                            },
                        },
                    },
                },
            ],
        });

        can(Action.Delete, 'Playlist', {
            OR: [
                {
                    userId: user.id,
                },
                {
                    sharedUsers: {
                        some: {
                            userId: user.id,
                            access: AccessPolicy.DELETE,
                        },
                    },
                },
            ],
        });

        can(Action.Create, 'PlaylistVideo', {
            OR: [
                {
                    playlist: {
                        userId: user.id,
                    },
                },
                {
                    playlist: {
                        sharedUsers: {
                            some: {
                                userId: user.id,
                                access: {
                                    'in': [AccessPolicy.UPDATE, AccessPolicy.DELETE],
                                },
                            },
                        },
                    },
                },
            ],
        });

        can(Action.Read, 'PlaylistVideo', {
            AND: [
                {
                    OR: [
                        {
                            playlist: {
                                userId: user.id,
                            },
                        },
                        {
                            playlist: {
                                isPublic: true,
                            },
                        },
                        {
                            playlist: {
                                sharedUsers: {
                                    some: {
                                        AND: [
                                            {
                                                userId: user.id,
                                            },
                                            {
                                                NOT: {
                                                    access: AccessPolicy.DENY,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    video: {
                        media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                    },
                },
            ],
        });

        can(Action.Update, 'PlaylistVideo', {
            AND: [
                {
                    OR: [
                        {
                            playlist: {
                                userId: user.id,
                            },
                        },
                        {
                            playlist: {
                                sharedUsers: {
                                    some: {
                                        userId: user.id,
                                        access: {
                                            'in': [AccessPolicy.UPDATE, AccessPolicy.DELETE],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    video: {
                        media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                    },
                },
            ],
        });

        can(Action.Delete, 'PlaylistVideo', {
            AND: [
                {
                    OR: [
                        {
                            playlist: {
                                userId: user.id,
                            },
                        },
                        {
                            playlist: {
                                sharedUsers: {
                                    some: {
                                        userId: user.id,
                                        access: AccessPolicy.DELETE,
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    video: {
                        media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                    },
                },
            ]
        });
    }

    authorize (context: AuthorizationContext, ability: AppAbilityType, rules: Permission[]): TaskEither<boolean> {
        if (context.isSocket) {
            return TaskEither.of(true);
        }

        const request = context.getRequest<{ playlist: Playlist, playlistVideo: PlaylistVideo }>();
        const playlistId = request.params.playlistId;
        const playlistVideoId = request.params.playlistVideoId;
        const playlistRules = rules.filter((rule) => rule.resource === 'Playlist');

        if (playlistId === undefined && playlistVideoId === undefined) {
            return TaskEither.of(true);
        }

        const [leastPermissiveAction] = sortActions(playlistRules.map((rule) => rule.action));

        return TaskEither
            .of({
                playlistId,
                playlistVideoId,
            })
            .matchTask([
                {
                    predicate: ({ playlistId }) => playlistId !== undefined,
                    run: ({ playlistId }) => this.readPlaylist(playlistId, ability, leastPermissiveAction, request),
                },
                {
                    predicate: ({ playlistVideoId }) => playlistVideoId !== undefined,
                    run: ({ playlistVideoId }) => this.readPlaylistVideo(playlistVideoId, ability, request),
                },
            ]);
    }

    private readPlaylist (playlistId: string, ability: AppAbilityType, action: Action, request: Request & { playlist: Playlist }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.findFirst({
                    where: {
                        AND: [
                            {
                                id: playlistId,
                            },
                            accessibleBy(ability, action).Playlist,
                        ],
                    },
                }),
                'Failed to read playlist',
            )
            .nonNullable('Playlist is not accessible')
            .ioSync((playlist) => request.playlist = playlist)
            .map(() => true);
    }

    private readPlaylistVideo (playlistVideoId: string, ability: AppAbilityType, request: Request & { playlistVideo: PlaylistVideo }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findFirst({
                    where: {
                        AND: [
                            {
                                id: playlistVideoId,
                            },
                            {
                                playlist: accessibleBy(ability, Action.Read).Playlist,
                            },
                            accessibleBy(ability, Action.Read).PlaylistVideo,
                        ],
                    },
                }),
                'Failed to read playlist video',
            )
            .nonNullable('Video is not accessible')
            .map((playlistVideo) => {
                request.playlistVideo = playlistVideo;

                return true;
            });
    }
}
