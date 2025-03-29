import { createParamDecorator } from '@eleven-am/authorizer';
import { Context } from '@eleven-am/pondsocket-nest';
import { UnauthorizedException } from '@nestjs/common';

import { SESSION_CONTEXT_KEY, SESSION_COOKIE_NAME } from '../session/session.constants';
import { CachedSession } from '../session/session.contracts';

export const CurrentSession = createParamDecorator(
    (context) => {
        let session: CachedSession | null;

        if (context instanceof Context) {
            session = context.getData(SESSION_CONTEXT_KEY);
        } else {
            session = context.session;
        }

        if (!session) {
            throw new UnauthorizedException('User is not authenticated');
        }

        return session;
    },
);

export const CurrentToken = createParamDecorator(
    (context) => {
        let token: string | null;

        if (context instanceof Context) {
            token = context.getData(SESSION_COOKIE_NAME);
        } else {
            token = context.authToken;
        }

        if (!token) {
            throw new UnauthorizedException('User is not authenticated');
        }

        return token;
    },
);
