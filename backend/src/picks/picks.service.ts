import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither, sortBy } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Media, PickType, PickCategory } from '@prisma/client';
import { RecommendationsService } from '../media/recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { mapPageResponse } from '../utils/helper.fp';
import { HomeResponseTypes } from '../utils/utils.contracts';
import { SELECTED_TRENDING } from './picks.constants';
import {
    CreatePicksArgs,
    UpdatePicksArgs,
    GetPicksArgs,
    Pick,
    PickResponseSchema,
    GetPaginatedPicksArgs,
    DeletePicksArgs,
} from './picks.contracts';


@Injectable()
export class PicksService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly recommendation: RecommendationsService,
    ) {}

    /**
     * @desc Create a pick category
     * @param args - The arguments for creating a pick
     */
    createPickCategory (args: CreatePicksArgs) {
        const create = (index: number) => TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.create({
                    data: {
                        name: args.name,
                        active: args.isActive,
                        type: args.type,
                        displayOrder: index,
                        picks: {
                            create: args.media.map((media) => ({
                                displayOrder: media.index,
                                media: { connect: { id: media.id } },
                            })),
                        },
                    },
                    include: {
                        picks: {
                            include: {
                                media: true,
                            },
                        },
                    }
                }),
                'Failed to create pick',
            )

        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.count({
                    where: {
                        type: args.type,
                    },
                }),
                'Failed to create pick',
            )
            .chain((count) => create(count))
            .map(this.mapPickCategory.bind(this));
    }

    /**
     * @desc Update a pick category
     * @param category - The pick category to update
     * @param args - The arguments for updating a pick
     */
    updatePickCategory (category: PickCategory, args: UpdatePicksArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.update({
                    where: { id: category.id },
                    data: {
                        name: args.name,
                        active: args.isActive,
                        type: args.type,
                        picks: {
                            deleteMany: {},
                            create: args.media.map((media) => ({
                                displayOrder: media.index,
                                media: { connect: { id: media.id } },
                            })),
                        }
                    },
                    include: {
                        picks: {
                            include: {
                                media: true,
                            },
                        },
                    }
                }),
                'Failed to update pick',
            )
            .map(this.mapPickCategory.bind(this));
    }

    /**
     * @desc Delete a pick category
     * @param args - The arguments for deleting a pick
     */
    deletePicksCategory (args: DeletePicksArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.deleteMany({
                    where: {
                        id: {
                            'in': args.ids,
                        }
                    },
                }),
                'Failed to delete picks',
            )
            .map(() => ({
                message: 'Picks deleted successfully',
            }))
    }

    /**
     * @desc Get a pick category for the home screen
     * @param args - The args to use to get the pick
     * @param ability - The ability to use to get the pick
     */
    getPickForHomeScreen (args: GetPicksArgs, ability: AppAbilityType) {
        const mapPickFunction = (pick: Pick) => this.recommendation
            .buildHomeResponse(
                pick.name,
                pick.id,
                pick.type === PickType.EDITOR ? HomeResponseTypes.EDITOR : HomeResponseTypes.BASIC,
            );

        const mapMediaFunction = (pick: Pick) => sortBy(pick.picks, 'displayOrder', 'asc')
            .map((item) => this.recommendation.toSlimMedia(item.media));

        const mapFunction = (pick: Pick) => {
            const func = mapPickFunction(pick);
            const media = mapMediaFunction(pick);

            return func(media);
        }

        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.findFirst({
                    where: {
                        displayOrder: args.index - 1,
                        type: args.type,
                    },
                    include: {
                        picks: {
                            where: accessibleBy(ability, Action.Read).PickItem,
                            include: {
                                media: true,
                            },
                        },
                    }
                }),
                'Failed to get pick',
            )
            .nonNullable('Pick not found')
            .map(mapFunction);
    }

    /**
     * @desc Get back a list of picks in a paginated format
     * @param args - The pagination arguments
     * @param ability - The ability to use to get the picks
     */
    getPicks (args: GetPaginatedPicksArgs, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.paginate({
                    paginate: args,
                    where: {
                        type: args.type,
                    },
                    include: {
                        picks: {
                            where: accessibleBy(ability, Action.Read).PickItem,
                            include: {
                                media: true,
                            },
                        },
                    },
                }),
                'Failed to get picks',
            )
            .map(mapPageResponse(this.mapPickCategory.bind(this)));
    }

    /**
     * @desc Get the number of picks for the editor and basic picks
     */
    getPickCounts () {
        const count = (type: PickType) => TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.count({
                    where: { type },
                }),
                'Failed to get pick count',
            )

        return TaskEither
            .fromBind({
                basic: count(PickType.BASIC),
                editor: count(PickType.EDITOR),
            })
    }

    /**
     * @desc Set a media as selected trending
     * @param media - The media to set as selected trending
     */
    setMediaAsSelectedTrending (media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.upsert({
                    where: { name: SELECTED_TRENDING },
                    create: {
                        name: SELECTED_TRENDING,
                        type: PickType.BASIC,
                        active: true,
                        displayOrder: 0,
                        picks: {
                            create: {
                                displayOrder: 0,
                                media: { connect: { id: media.id } },
                            },
                        },
                    },
                    update: {
                        picks: {
                            deleteMany: {},
                            create: {
                                displayOrder: 0,
                                media: { connect: { id: media.id } },
                            },
                        }
                    },
                    include: {
                        picks: {
                            include: {
                                media: true,
                            },
                        },
                    }
                }),
                'Failed to set media as trending',
            )
            .map(this.mapPickCategory.bind(this));
    }

    /**
     * @desc Get the selected trending media
     * @param ability - The ability to use to get the selected trending
     */
    getSelectedTrending (ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.findFirst({
                    where: { name: SELECTED_TRENDING },
                    include: {
                        picks: {
                            where: accessibleBy(ability, Action.Read).PickItem,
                            include: {
                                media: true,
                            },
                        },
                    },
                }),
                'Failed to get selected trending',
            )
            .nonNullable('Selected trending not found')
            .map((category) => category.picks[0])
            .nonNullable('Selected trending not found')
            .map((pick) => this.recommendation.toSlimMedia(pick.media));
    }

    /**
     * @desc Get a pick category
     * @param category - The pick category to get
     */
    getPickCategory(category: PickCategory) {
        return TaskEither
            .tryCatch(
                () => this.prisma.pickCategory.findFirst({
                    where: { id: category.id },
                    include: {
                        picks: {
                            include: {
                                media: true,
                            },
                        },
                    },
                }),
                'Failed to get pick category',
            )
            .nonNullable('Pick category not found')
            .map(this.mapPickCategory.bind(this));
    }

    private mapPickCategory (category: Pick): PickResponseSchema {
        return {
            type: category.type,
            name: category.name,
            id: category.id,
            isActive: category.active,
            index: category.displayOrder,
            media: category.picks.map((pick) => ({
                media: this.recommendation.toSlimMedia(pick.media),
                index: pick.displayOrder,
            })),
        };
    }
}
