import { accessibleBy } from '@casl/prisma';
import { WillAuthorize, Authorizer, RuleBuilder, Action, AppAbilityType, Permission } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { ExecutionContext } from '@nestjs/common';
import { User, AccessPolicy } from '@prisma/client';

import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';

@Authorizer()
export class FramesAuthorizer implements WillAuthorize {
    constructor (private readonly prismaService: PrismaService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'Frame').because('User is not authorised to access the Frame resource');

            return;
        }

        can(Action.Read, 'Frame', {
            view: {
                video: {
                    media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                },
            },
        });

        can(Action.Manage, 'Frame', {
            AND: [
                {
                    userId: user.id,
                },
                {
                    view: {
                        video: {
                            media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                        },
                    },
                },
            ],
        });
    }

    checkHttpAction (ability: AppAbilityType, _rules: Permission[], context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const cypher = request.params.cypher;

        if (cypher === undefined) {
            return TaskEither.of(true);
        }

        return TaskEither
            .tryCatch(
                () => this.prismaService.frame
                    .findFirst({
                        where: {
                            AND: [
                                { cypher },
                                accessibleBy(ability, Action.Read).Frame,
                            ],
                        },
                    }),
                'Failed to retrieve frame',
            )
            .nonNullable('Frame not found')
            .map((frame) => {
                request.frame = frame;

                return true;
            });
    }
}
