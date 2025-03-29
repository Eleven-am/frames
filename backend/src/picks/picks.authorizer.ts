import { accessibleBy } from '@casl/prisma';
import { WillAuthorize, Authorizer, RuleBuilder, Action, AppAbilityType, Permission } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { ExecutionContext } from '@nestjs/common';
import { User, Role, AccessPolicy } from '@prisma/client';

import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';

@Authorizer()
export class PicksAuthorizer implements WillAuthorize {
    constructor (private readonly prismaService: PrismaService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'PickCategory').because('User is not authorised to access the PickCategory resource');
            cannot(Action.Manage, 'PickItem').because('User is not authorised to access the PickItem resource');

            return;
        }

        can(Action.Read, 'PickCategory');
        can(Action.Read, 'PickItem', {
            media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
        });

        if (user.role === Role.ADMIN) {
            can(Action.Manage, 'PickCategory');
            can(Action.Manage, 'PickItem');
        }
    }

    checkHttpAction (ability: AppAbilityType, _rules: Permission[], context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const categoryId = request.params.categoryId;

        if (categoryId === undefined) {
            return TaskEither.of(true);
        }

        return TaskEither
            .tryCatch(
                () => this.prismaService.pickCategory
                    .findFirst({
                        where: {
                            AND: [
                                { id: categoryId },
                                accessibleBy(ability, Action.Read).PickCategory,
                            ],
                        },
                    }),
                'Error checking pick category access',
            )
            .nonNullable('Pick category not found')
            .map((item) => {
                request.pickCategory = item;
                return true;
            })
    }
}
