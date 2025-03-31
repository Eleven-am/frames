import { createParamDecorator } from '@eleven-am/authorizer';
import { UnauthorizedException } from '@nestjs/common';

import { SESSION_CONTEXT_KEY, SESSION_COOKIE_NAME } from '../session/session.constants';
import { CachedSession } from '../session/session.contracts';

export const CurrentSession = createParamDecorator(
    (context) => {
        const session = context.getData<CachedSession>(SESSION_CONTEXT_KEY);

        if (!session) {
            throw new UnauthorizedException('User is not authenticated');
        }

        return session;
    },
);

export const CurrentToken = createParamDecorator(
    (context) => {
        let token = context.getData<string>(SESSION_COOKIE_NAME);

        if (!token) {
            throw new UnauthorizedException('User is not authenticated');
        }

        return token;
    },
);
