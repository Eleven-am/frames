import { WillAuthorize, Authorizer, RuleBuilder, Action } from '@eleven-am/authorizer';
import { User, Role } from '@prisma/client';

import { OauthService } from './oauth.service';


@Authorizer()
export class OauthAuthorizer implements WillAuthorize {
    constructor (private readonly oauthService: OauthService) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.role !== Role.ADMIN) {
            cannot(Action.Manage, 'Oauth').because('User is not authorised to access the Oauth resource');
        } else {
            can(Action.Manage, 'Oauth');
        }
    }
}
