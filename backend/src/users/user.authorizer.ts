import { WillAuthorize, Authorizer, RuleBuilder, Action } from '@eleven-am/authorizer';
import { User } from '@prisma/client';


@Authorizer()
export class UserAuthorizer implements WillAuthorize {
    forUser (user: User, { can }: RuleBuilder) {
        can(Action.Manage, 'User', { id: user.id });
    }
}
