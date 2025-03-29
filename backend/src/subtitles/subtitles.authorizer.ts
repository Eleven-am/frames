import { accessibleBy } from '@casl/prisma';
import {
    WillAuthorize,
    Authorizer,
    RuleBuilder,
    sortActions,
    Action,
    Permission,
    AppAbilityType,
} from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { ExecutionContext } from '@nestjs/common';
import { User, AccessPolicy } from '@prisma/client';

import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';

@Authorizer()
export class SubtitlesAuthorizer implements WillAuthorize {
    constructor (private readonly prisma: PrismaService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'Subtitle').because('User is not authorised to access the Subtitle resource');

            return;
        }

        can(Action.Read, 'Subtitle', {
            video: {
                media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
            },
        });

        can(Action.Update, 'Subtitle', {
            video: {
                media: MediaAuthorizer.getQuery(user, AccessPolicy.UPDATE),
            },
        });

        can(Action.Delete, 'Subtitle', {
            video: {
                media: MediaAuthorizer.getQuery(user, AccessPolicy.DELETE),
            },
        });
    }

    checkHttpAction (ability: AppAbilityType, rules: Permission[], context: ExecutionContext) {
        const subtitleRules = rules.filter((rule) => rule.resource === 'Subtitle');
        const request = context.switchToHttp().getRequest();
        const subtitleId = request.params.subtitleId;

        if (subtitleId === undefined) {
            return TaskEither.of(true);
        }

        const [leastPermissiveAction] = sortActions(subtitleRules.map((rule) => rule.action));

        return TaskEither
            .fromNullable(leastPermissiveAction)
            .chain((action) => TaskEither
                .tryCatch(
                    () => this.prisma.subtitle.findFirst({
                        where: {
                            AND: [
                                {
                                    id: subtitleId,
                                },
                                accessibleBy(ability, action).Subtitle,
                            ],
                        },
                    }),
                    'Failed to find subtitle',
                ))
            .nonNullable('Subtitle is not accessible')
            .map((subtitle) => {
                request.subtitle = subtitle;

                return true;
            });
    }
}
