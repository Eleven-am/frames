import { accessibleBy } from '@casl/prisma';
import {
    WillAuthorize,
    sortActions,
    Authorizer,
    RuleBuilder,
    Action,
    AppAbilityType,
    Permission, AuthorizationContext,
} from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { Inject } from '@nestjs/common';
import { Role, User } from '@prisma/client';

import { ADMIN_EMAIL_SYMBOL } from './storage.constants';
import { PrismaService } from '../prisma/prisma.service';


@Authorizer()
export class StorageAuthorizer implements WillAuthorize {
    constructor (
        private readonly prisma: PrismaService,
        @Inject(ADMIN_EMAIL_SYMBOL) private readonly adminEmail: string,
    ) {}

    forUser (user: User, { can, cannot }: RuleBuilder): void {
        if (user.role !== Role.ADMIN) {
            cannot(Action.Manage, 'CloudStorage').because('User is not authorised to access the CloudStorage resource');

            return;
        }

        if (user.email === this.adminEmail) {
            can(Action.Delete, 'CloudStorage');
        }

        can(Action.Create, 'CloudStorage');
        can(Action.Read, 'CloudStorage');
        can(Action.Update, 'CloudStorage', { userId: user.id });
        can(Action.Delete, 'CloudStorage', { userId: user.id });
    }

    authorize (context: AuthorizationContext, ability: AppAbilityType, rules: Permission[]): TaskEither<boolean> {
        if (context.isSocket) {
            return TaskEither.of(true);
        }

        const request = context.getRequest();
        const storageId = request.params.storageId;
        const storageRules = rules.filter((rule) => rule.resource === 'CloudStorage');

        if (storageId === undefined || storageRules.length === 0) {
            return TaskEither.of(true);
        }

        const [leastPermissiveAction] = sortActions(storageRules.map((rule) => rule.action));

        return this.retrieveStorage(storageId, ability, leastPermissiveAction)
            .map((storage) => {
                request.storage = storage;

                return true;
            });
    }

    private retrieveStorage (storageId: string, ability: AppAbilityType, action: Action) {
        return TaskEither
            .tryCatch(
                () => this.prisma.cloudStorage.findFirst({
                    where: {
                        AND: [
                            {
                                id: storageId,
                            },
                            accessibleBy(ability, action).CloudStorage,
                        ],
                    },
                }),
                'Failed to read storage',
            )
            .nonNullable('Storage is not accessible');
    }
}
