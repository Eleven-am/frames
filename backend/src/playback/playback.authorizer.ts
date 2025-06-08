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
import { AccessPolicy, User, Video } from '@prisma/client';
import { Request } from 'express';

import { Playback } from './playback.schema';
import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';


@Authorizer()
export class PlaybackAuthorizer implements WillAuthorize {
    constructor (
        private readonly prisma: PrismaService,
    ) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'View').because('User is not authorised to access the View resource');

            return;
        }

        can(Action.Read, 'View', {
            video: {
                media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
            },
        });

        can(Action.Manage, 'View', {
            AND: [
                {
                    userId: user.id,
                },
                {
                    video: {
                        media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                    },
                },
            ],
        });

        can(Action.Manage, 'Watched', {
            AND: [
                {
                    userId: user.id,
                },
                {
                    video: {
                        media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                    },
                },
            ],
        });
    }

    authorize (context: AuthorizationContext, ability: AppAbilityType, rules: Permission[]) {
        if (context.isSocket) {
            return TaskEither.of(true);
        }

        const playbackRules = rules.filter((rule) => rule.resource === 'View');
        const request = context.getRequest<{ playback: Playback, video: Video }>();
        const playbackId = request.params.playbackId;
        const videoId = request.params.videoId;

        const [leastPermission] = sortActions(playbackRules.map((rule) => rule.action));

        if (playbackId === undefined && videoId === undefined) {
            return TaskEither.of(true);
        }

        return TaskEither
            .of({
                playbackId,
                videoId,
            })
            .matchTask([
                {
                    predicate: ({ playbackId }) => playbackId !== undefined,
                    run: ({ playbackId }) => this.getPlayback(playbackId, leastPermission, ability, request),
                },
                {
                    predicate: ({ videoId }) => videoId !== undefined,
                    run: ({ videoId }) => this.getVideo(videoId, ability, request),
                },
            ]);
    }

    private getPlayback (playbackId: string, leastPermission: Action, ability: AppAbilityType, request: Request & { playback: Playback }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.view.findFirst({
                    where: {
                        AND: [
                            {
                                id: playbackId,
                            },
                            accessibleBy(ability, leastPermission).View,
                        ],
                    },
                    include: { video: { include: { cloudStorage: true } } },
                }),
                'Failed to retrieve playback',
            )
            .nonNullable('Playback not found')
            .map((playback) => {
                request.playback = playback;

                return true;
            });
    }

    private getVideo (videoId: string, ability: AppAbilityType, request: Request & { video: Video }) {
        return TaskEither
            .tryCatch(
                () => this.prisma.video.findFirst({
                    where: {
                        AND: [
                            {
                                id: videoId,
                            },
                            {
                                media: accessibleBy(ability, Action.Read).Media,
                            },
                        ],
                    },
                }),
                'Failed to retrieve video',
            )
            .nonNullable('Video not found')
            .map((video) => {
                request.video = video;

                return true;
            });
    }
}
