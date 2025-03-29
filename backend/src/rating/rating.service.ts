import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Media, User } from '@prisma/client';

import { RatedStatus } from './rating.contracts';
import { RecommendationsService } from '../media/recommendations.service';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class RatingService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @description Find all media the user has rated positively
     * @param ability - The user's permissions
     */
    findAll (ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.rating.random({
                    where: {
                        AND: [{ rate: true }, accessibleBy(ability, Action.Read).Rating],
                    },
                    include: { media: true },
                    length: 12,
                }),
                'Failed to find ratings',
            )
            .mapItems((rating) => rating.media)
            .mapItems(this.recommendationsService.toSlimMedia)
            .map(
                this.recommendationsService.buildEditorialHomeResponse(
                    'media you love',
                    'rated-positive',
                ),
            );
    }

    /**
   * @description Find the current rating for a media
   * @param user - The user to find ratings for
   * @param media - The media to find ratings for
   */
    findOne (user: User, media: Media) {
        return TaskEither.tryCatch(
            () => this.prisma.rating.findUnique({
                where: {
                    ratedByUser: {
                        userId: user.id,
                        mediaId: media.id,
                    },
                },
            }),
            'Failed to find rating',
        )
            .map((rating) => rating
                ? rating.rate
                    ? RatedStatus.POSITIVE
                    : RatedStatus.NEGATIVE
                : RatedStatus.NONE)
            .map((status) => ({ status }));
    }

    /**
   * @description Remove a rating for a media on behalf of a user
   * @param user - The user to remove the rating for
   * @param media - The media to remove the rating for
   */
    remove (user: User, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.rating.delete({
                    where: {
                        ratedByUser: {
                            userId: user.id,
                            mediaId: media.id,
                        },
                    },
                }),
                'Failed to remove rating',
            )
            .map(() => RatedStatus.NONE)
            .map((status) => ({ status }));
    }

    /**
   * @description Rate media positively on behalf of a user
   * @param user - The user to rate media for
   * @param media - The media to rate
   */
    ratePositive (user: User, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.rating.upsert({
                    where: {
                        ratedByUser: {
                            userId: user.id,
                            mediaId: media.id,
                        },
                    },
                    create: {
                        userId: user.id,
                        mediaId: media.id,
                        rate: true,
                    },
                    update: {
                        rate: true,
                    },
                }),
                'Failed to rate media positively',
            )
            .map(() => RatedStatus.POSITIVE)
            .map((status) => ({ status }));
    }

    /**
   * @description Rate media negatively on behalf of a user
   * @param user - The user to rate media for
   * @param media - The media to rate
   */
    rateNegative (user: User, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.rating.upsert({
                    where: {
                        ratedByUser: {
                            userId: user.id,
                            mediaId: media.id,
                        },
                    },
                    create: {
                        userId: user.id,
                        mediaId: media.id,
                        rate: false,
                    },
                    update: { rate: false },
                }),
                'Failed to rate media negatively',
            )
            .map(() => RatedStatus.NEGATIVE)
            .map((status) => ({ status }));
    }
}
