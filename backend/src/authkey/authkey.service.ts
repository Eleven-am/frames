import { accessibleBy } from '@casl/prisma';
import { Action, AppAbilityType } from '@eleven-am/authorizer';
import { TaskEither, createForbiddenError } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { User, AuthKey, View, Video, Media, Episode, UseCase } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPageResponse } from '../utils/helper.fp';
import { PaginateArgs } from '../utils/utils.contracts';

import { AuthKeyResponse } from './authkey.contracts';


@Injectable()
export class AuthKeyService {
    constructor (private readonly prisma: PrismaService) {}

    /**
     * @desc Find authKey by key
     * @param authKey - The authKey to find
     */
    findByAuthKey (authKey: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.authKey.findFirst({
                    where: {
                        AND: [{ authKey }, { revoked: false }],
                    },
                }),
                'Failed to find authKey by key',
            )
            .nonNullable('AuthKey not found');
    }

    /**
     * @desc Create an authKey
     * @param userId - The user id to create the authKey for
     */
    createAuthKey (userId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.authKey.create({
                    data: {
                        authKey: this.generateAuthKey(),
                        user: { connect: { id: userId } },
                    },
                }),
                'Failed to create authKey',
            );
    }

    /**
     * @desc Revoke an authKey
     * @param authKey - The authKey to revoke
     * @param userId - The user id to revoke the authKey for
     * @param useCase - The useCase for the authKey
     * @param viewId - The view id for the authKey
     */
    revokeAuthKey (authKey: string, userId: string, useCase: UseCase = UseCase.SIGNUP, viewId: string | null = null) {
        return this.findByAuthKey(authKey)
            .filter(
                (authKey) => !authKey.revoked,
                () => createForbiddenError('AuthKey already revoked'),
            )
            .chain((authKey) => TaskEither
                .tryCatch(
                    () => this.prisma.authKey.update({
                        where: { id: authKey.id },
                        data: {
                            revoked: true,
                            useCase,
                            view: viewId ? { connect: { id: viewId } } : undefined,
                            user: { connect: { id: userId } },
                        },
                    }),
                    'Failed to revoke authKey',
                ));
    }

    /**
     * @desc Get all authKeys
     * @param paginated - The pagination options
     * @param ability - The ability to check access
     */
    getAuthKeys (paginated: PaginateArgs, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.authKey.paginate({
                    where: {
                        OR: [
                            {
                                useCase: UseCase.DOWNLOAD,
                                view: {
                                    video: {
                                        media: accessibleBy(ability, Action.Read).Media,
                                    },
                                },
                            },
                            {
                                useCase: UseCase.SIGNUP,
                            },
                        ],
                    },
                    include: {
                        user: true,
                        view: {
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                        episode: true,
                                    },
                                },
                            },
                        },
                    },
                    paginate: paginated,
                }),
                'Failed to find all authKeys',
            )
            .map(mapPageResponse(this.mapAuthKey));
    }

    private generateAuthKey () {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        return Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => characters[Math.floor(Math.random() * characters.length)]).join('')).join('-');
    }

    private mapAuthKey (authKey: AuthKey & {
        user: User;
        view:
        | (View & {
            video: Video & { media: Media, episode: Episode | null };
        })
        | null;
    }) {
        const description = authKey.useCase === UseCase.SIGNUP && authKey.revoked
            ? `${authKey.user.username} signed up with this auth key`
            : authKey.view && authKey.revoked
                ? authKey.view.video.episode
                    ? `${authKey.user.username} downloaded ${authKey.view.video.media.name}: S${authKey.view.video.episode.season}, E${authKey.view.video.episode.episode} using this auth key`
                    : `${authKey.user.username} downloaded ${authKey.view.video.media.name} using this auth key`
                : `${authKey.user.username} created this auth key`;

        const response: AuthKeyResponse = {
            description,
            'case': authKey.useCase,
            backdrop: authKey.view?.video.media.backdrop || '',
            key: authKey.authKey,
            name: `Key: ${authKey.authKey}`,
            revoked: authKey.revoked,
            date: authKey.updated,
        };

        return response;
    }
}
