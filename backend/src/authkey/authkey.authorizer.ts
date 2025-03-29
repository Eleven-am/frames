import { WillAuthorize, RuleBuilder, Action, AppAbilityType, Permission, Authorizer } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { ExecutionContext } from '@nestjs/common';
import { User, Role } from '@prisma/client';

import { AuthKeyService } from './authkey.service';

@Authorizer()
export class AuthKeyAuthorizer implements WillAuthorize {
    constructor (private readonly authKeyService: AuthKeyService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.role === Role.GUEST || user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'AuthKey').because('User is not authorised to access the AuthKey resource');

            return;
        }

        if (user.role === Role.USER || user.role === Role.OAUTH) {
            can(Action.Read, 'AuthKey');
            can(Action.Update, 'AuthKey');

            return;
        }

        can(Action.Manage, 'AuthKey');
    }

    checkHttpAction (_ability: AppAbilityType, rules: Permission[], context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authKey = request.params.authKey;
        const authKeyRules = rules.filter((rule) => rule.resource === 'AuthKey');

        if (
            (
                (!authKeyRules.length) ||
                (authKeyRules.length === 1 && authKeyRules[0].action === Action.Create)
            ) &&
            authKey === undefined
        ) {
            return TaskEither.of(true);
        }

        return this.authKeyService.findByAuthKey(authKey)
            .map((authKey) => {
                request.authKey = authKey;

                return true;
            });
    }
}
