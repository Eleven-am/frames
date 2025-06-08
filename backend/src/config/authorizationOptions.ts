import { AuthorizationMetadata, Authenticator } from '@eleven-am/authorizer';

import { SessionService } from '../session/session.service';

export const authorizationOptions: AuthorizationMetadata = {
    inject: [SessionService],
    useFactory: (sessionService: SessionService): Authenticator => ({
        allowNoRulesAccess: (context) => sessionService.allowNoRulesAccess(context),
        retrieveUser: (context) => sessionService.retrieveUser(context),
    }),
};
