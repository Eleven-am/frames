import { WillAuthorize, Authorizer, RuleBuilder, Action } from '@eleven-am/authorizer';
import { User, AccessPolicy } from '@prisma/client';

import { MediaAuthorizer } from '../media/media.authorizer';

@Authorizer()
export class RatingAuthorizer implements WillAuthorize {
    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'Rating').because('User is not authorised to access the Rating resource');
        }

        can(Action.Manage, 'Rating', {
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
