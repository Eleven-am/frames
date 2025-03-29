import { Authorizer, WillAuthorize, RuleBuilder, Action } from '@eleven-am/authorizer';
import { User, AccessPolicy } from '@prisma/client';

import { MediaAuthorizer } from '../media/media.authorizer';

@Authorizer()
export class SeenAuthorizer implements WillAuthorize {
    forUser (user: User, { can }: RuleBuilder) {
        can(Action.Manage, 'SeenMedia', {
            AND: [
                {
                    userId: user.id,
                },
                {
                    media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                },
            ],
        });
    }
}
