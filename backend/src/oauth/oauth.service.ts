import { TaskEither, createTemporaryRedirectError } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { OauthClient } from '@prisma/client';
import { Details } from 'express-useragent';
import { AuthorizationCode } from 'simple-oauth2';
import { v4 as uuid } from 'uuid';
import { CacheService } from '../cache/cache.service';
import { HttpService } from '../http/http.service';
import { PrismaService } from '../prisma/prisma.service';
import { mapPageResponse } from '../utils/helper.fp';
import { PaginateArgs } from '../utils/utils.contracts';

import {
    CreateOauthClientArgs,
    UpdateOauthClientArgs,
    profileSchema,
    OauthStateData,
    OauthResponseData,
} from './oauth.schema';


@Injectable()
export class OauthService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly cacheStore: CacheService,
    ) {}

    create (createOauthDto: CreateOauthClientArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.create({
                    data: createOauthDto,
                }),
                'Error creating oauth client',
            );
    }

    findAll (paginated: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.paginate({
                    paginate: paginated,
                }),
                'Error retrieving oauth clients',
            )
            .map(mapPageResponse((item) => ({
                id: item.id,
                buttonLabel: item.buttonLabel,
                color: item.color,
                logo: item.logo,
                name: item.name,
            })));
    }

    update (id: string, updateOauthDto: UpdateOauthClientArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.update({
                    where: { id },
                    data: updateOauthDto,
                }),
                'Error updating oauth client',
            );
    }

    remove (id: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.delete({
                    where: { id },
                }),
                'Error deleting oauth client',
            )
            .map(() => ({ message: 'Oauth client deleted' }));
    }

    findOne (id: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.findUnique({
                    where: { id },
                }),
                'Error retrieving oauth client',
            )
            .nonNullable('Oauth client not found');
    }

    generateURL (oauthId: string, ip: string, agent: Details, endpoint: string) {
        const state = uuid();

        return this.retrieveOauthClient(oauthId)
            .chain((oauthClient) => this.cacheStore.set(
                `${oauthClient.id}:${state}`,
                {
                    ip,
                    details: agent,
                },
                60 * 60,
            )
                .map(() => this.createAuthorizationUrl(oauthClient, state, endpoint)))
            .chain((url) => TaskEither.error(createTemporaryRedirectError(url)));
    }

    getOauthData (oauthId: string, code: string, state: string, endpoint: string) {
        return this.retrieveOauthClient(oauthId)
            .chain((oauthClient) => this.cacheStore.get<OauthStateData>(`${oauthClient.id}:${state}`)
                .nonNullable('Session not found')
                .ioSync(
                    () => this.cacheStore.del!(`${oauthClient.id}:${state}`),
                )
                .chain((session) => this.getProfile(oauthClient, code, endpoint)
                    .map((profile): OauthResponseData => ({
                        ...profile,
                        ip: session.ip,
                        details: session.details,
                    }))));
    }

    private getProfile (oauthClient: OauthClient, code: string, endpoint: string) {
        const client = this.createClient(oauthClient);

        return TaskEither
            .tryCatch(
                () => client.getToken({
                    code,
                    scope: oauthClient.scopes,
                    redirect_uri: this.getRedirectUri(oauthClient, endpoint),
                }),
                'Error getting access token',
            )
            .map((response) => response.token.access_token as string)
            .chain((accessToken) => this.httpService
                .getSafe(
                    oauthClient.userDataUrl,
                    profileSchema,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                ))
            .map((response) => {
                const email = 'email' in response ? response.email : response.mail;
                const username = email.split('@')[0];

                return {
                    email,
                    username,
                };
            });
    }

    private createAuthorizationUrl (oauthClient: OauthClient, state: string, endpoint: string) {
        const client = this.createClient(oauthClient);

        return client.authorizeURL({
            redirect_uri: this.getRedirectUri(oauthClient, endpoint),
            scope: oauthClient.scopes,
            state,
        });
    }

    private createClient (oauthClient: OauthClient) {
        return new AuthorizationCode({
            client: {
                id: oauthClient.clientId,
                secret: oauthClient.clientSecret,
            },
            auth: {
                tokenHost: oauthClient.tokenHost,
                tokenPath: oauthClient.tokenPath,
                authorizeHost: oauthClient.authorizeHost,
                authorizePath: oauthClient.authorizePath,
            },
        });
    }

    private retrieveOauthClient (oauthId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.oauthClient.findUnique({
                    where: { id: oauthId },
                }),
                'Error retrieving oauth client',
            )
            .nonNullable('Oauth client not found');
    }

    private getRedirectUri (oauthClient: OauthClient, endpoint: string) {
        return `${endpoint}/api/auth/${oauthClient.id}/callback`;
    }
}
