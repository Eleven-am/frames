import { accessibleBy } from '@casl/prisma';
import { Action, AppAbilityType } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Frame, User } from '@prisma/client';
import { RecommendationsService } from '../media/recommendations.service';
import { Playback } from '../playback/playback.schema';
import { PlaybackService } from '../playback/playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';
import { mapPageResponse } from '../utils/helper.fp';
import { PaginateArgs } from '../utils/utils.contracts';

import { CreateFrameArgs, FrameResponse } from './frames.contracts';


@Injectable()
export class FramesService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly playbackService: PlaybackService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @description Create a frame
     * @param user - The user creating the frame
     * @param playback - The playback the frame is for
     * @param percentage - The percentage of the video
     * @param cypher - The cypher of the video
     */
    createFrame (user: User, playback: Playback, { percentage, cypher }: CreateFrameArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.frame.create({
                    data: {
                        cypher,
                        percentage,
                        view: {
                            connect: { id: playback.id },
                        },
                        user: { connect: { id: user.id } },
                    },
                }),
                'Failed to create frame',
            )
            .map((frame) => ({
                cypher: frame.cypher,
                created: frame.created,
                percentage: frame.percentage,
            }));
    }

    /**
   * @description Delete a frame
   * @param cypher - The cypher of the frame
   */
    deleteFrame (cypher: Frame) {
        return TaskEither
            .tryCatch(
                () => this.prisma.frame.delete({
                    where: { id: cypher.id },
                }),
                'Failed to delete frame',
            )
            .map(() => ({
                message: 'Frame deleted successfully',
            }));
    }

    /**
     * @description Get a frame
     * @param session - The session of the user
     * @param cypher - The cypher of the frame
     */
    getFrame (session: CachedSession, cypher: Frame) {
        return TaskEither
            .tryCatch(
                () => this.prisma.frame.update({
                    where: { id: cypher.id },
                    data: { accessed: { increment: 1 } },
                    include: {
                        view: {
                            include: { video: { include: { episode: true } } },
                        },
                    },
                }),
                'Failed to get frames',
            )
            .chain((frame) => this.playbackService.getPlaybackSession(
                {
                    video: frame.view.video,
                    cachedSession: session,
                    percentage: frame.percentage,
                    isFrame: true,
                }
            ));
    }

    /**
     * @description Get frames
     * @param ability - The ability of the user
     * @param paginateMediaArgs - The pagination arguments
     */
    getFrames (ability: AppAbilityType, paginateMediaArgs: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.frame.paginate({
                    where: accessibleBy(ability, Action.Manage).Frame,
                    include: {
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
                    paginate: paginateMediaArgs,
                }),
                'Failed to get frames',
            )
            .map(mapPageResponse((frame): FrameResponse => ({
                ...this.recommendationsService.toSlimMedia(frame.view.video.media),
                percentage: frame.percentage,
            })));
    }
}
