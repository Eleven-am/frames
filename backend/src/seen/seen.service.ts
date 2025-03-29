import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { dedupeBy, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Media, User, Watched, Video, Episode, SeenMedia } from '@prisma/client';

import { SeenResponse } from './seen.contracts';
import { RecommendationsService } from '../media/recommendations.service';
import { COMPLETED_VIDEO_POSITION } from '../playback/playback.constants';
import { PrismaService } from '../prisma/prisma.service';
import { mapPageResponse } from '../utils/helper.fp';
import { PaginateArgs } from '../utils/utils.contracts';


@Injectable()
export class SeenService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
   * @description Create a seen record for a user and a media
   * @param user - The user that has seen the media
   * @param media - The media that the user has seen
   */
    create (user: User, media: Media) {
        const mapMediaToWatched = (media: Media & { watched: (Watched & { video: (Video & {episode: Episode | null})})[], videos: (Video & {episode: Episode | null})[] }) => {
            const watched = media.watched.map((video) => ({
                videoId: video.videoId,
                percentage: COMPLETED_VIDEO_POSITION,
                episodeId: video.video.episode?.id ?? null,
                mediaId: media.id,
                userId: user.id,
                times: video.times + 1,
            }));

            const unwatched = media.videos.map((video) => ({
                videoId: video.id,
                percentage: COMPLETED_VIDEO_POSITION,
                episodeId: video.episode?.id ?? null,
                mediaId: media.id,
                userId: user.id,
                times: 1,
            }));

            return dedupeBy([...watched, ...unwatched], 'videoId');
        };

        const updateWatched = (videos: Omit<Watched, 'id' | 'created' | 'updated'>[]) => TaskEither
            .tryCatch(
                () => this.prisma.watched.deleteMany({
                    where: {
                        userId: user.id,
                        mediaId: media.id,
                    },
                }),
                'Failed to save seen',
            )
            .chain(() => TaskEither.tryCatch(
                () => this.prisma.watched.createMany({
                    data: videos,
                }),
                'Failed to save seen',
            ));

        const upsertSeen = TaskEither
            .tryCatch(
                () => this.prisma.seenMedia.upsert({
                    where: {
                        seenByUser: {
                            mediaId: media.id,
                            userId: user.id,
                        },
                    },
                    create: {
                        mediaId: media.id,
                        userId: user.id,
                        times: 1,
                    },
                    update: {
                        times: {
                            increment: 1,
                        },
                    },
                }),
                'Failed to save seen',
            );

        return this.findMediaById(media.id, user.id)
            .chain((media) => updateWatched(mapMediaToWatched(media)))
            .chain(() => upsertSeen)
            .chain(() => this.findOne(user, media));
    }

    /**
     * @description Find all media that a user has seen
     * @param user - The user to find seen media for
     * @param ability - The user's ability
     * @param paginateMediaArgs - The pagination arguments
     */
    findAll (user: User, ability: AppAbilityType, paginateMediaArgs: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.paginate({
                    where: {
                        AND: [
                            {
                                seenMedia: {
                                    some: {
                                        userId: user.id,
                                    },
                                },
                            },
                            accessibleBy(ability, Action.Read).Media,
                        ],
                    },
                    paginate: paginateMediaArgs,
                }),
                'Failed to find media',
            )
            .map(mapPageResponse(this.recommendationsService.toSlimMedia));
    }

    /**
   * @description Get the seen status of a media for a user
   * @param user - The user to find seen media for
   * @param media - The media to find seen status for
   */
    findOne (user: User, media: Media) {
        const mapMediaToWatched = (media: Media & { watched: Watched[], seenMedia: SeenMedia[] }) => {
            const watched = media.watched.map((video) => ({
                videoId: video.videoId,
                percentage: video.percentage,
            }));

            return {
                hasSeen: media.seenMedia.length > 0,
                videosSeen: watched,
            } as SeenResponse;
        };

        return this.findMediaById(media.id, user.id)
            .map(mapMediaToWatched);
    }

    /**
   * @description Remove the seen status of a media for a user
   * @param user - The user to remove seen media for
   * @param media - The media to remove seen status for
   */
    remove (user: User, media: Media) {
        const deleteWatched = TaskEither
            .tryCatch(
                () => this.prisma.watched.deleteMany({
                    where: {
                        userId: user.id,
                        mediaId: media.id,
                    },
                }),
                'Failed to remove seen',
            );

        const deleteSeen = TaskEither
            .tryCatch(
                () => this.prisma.seenMedia.delete({
                    where: {
                        seenByUser: {
                            mediaId: media.id,
                            userId: user.id },
                    },
                }),
                'Failed to remove seen',
            );

        return deleteWatched
            .chain(() => deleteSeen)
            .chain(() => this.findOne(user, media));
    }

    private findMediaById (mediaId: string, userId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findUnique({
                    where: { id: mediaId },
                    include: {
                        videos: { include: { episode: true } },
                        seenMedia: { where: { userId } },
                        watched: {
                            where: { userId },
                            include: { video: { include: { episode: true } } },
                        },
                    },
                }),
                `Failed to find media with id: ${mediaId}`,
            )
            .nonNullable('Media not found');
    }
}
