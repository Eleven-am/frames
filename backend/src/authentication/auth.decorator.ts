import { applyDecorators, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import * as useragent from 'express-useragent';


import { WEB_AUTHN_CACHE_KEY } from './auth.constants';
import { EmailResponseSchema } from './auth.contracts';
import { getHTTPCurrentData } from '../utils/helper.fp';

export const UserAgent = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        return useragent.parse(request.headers['user-agent']);
    },
);

export const ServerAddress = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request: Request = context.switchToHttp().getRequest();
        const protocol = request.protocol;
        const host = request.get('host');

        return `${protocol}://${host}`;
    },
);

export const HostAddress = getHTTPCurrentData(
    (request: Request) => {
        const address = request.get('host') || request.get('x-forwarded-host');

        if (!address) {
            return null;
        }

        const [host] = address.split(':');

        return host;
    },
    'Host address',
);

export const PassKeySession = getHTTPCurrentData(
    (request: Request) => {
        const cookie = request.cookies[WEB_AUTHN_CACHE_KEY];

        if (!cookie) {
            return null;
        }

        return JSON.parse(Buffer.from(cookie, 'base64').toString());
    },
    'Passkey',
);

export const ApiEmailResponse = ({ description, summary, action }: { description: string, summary: string, action: string }) => applyDecorators(
    ApiOperation({
        summary,
        description,
    }),
    ApiOkResponse({
        description: action,
        type: EmailResponseSchema,
    }),
);

