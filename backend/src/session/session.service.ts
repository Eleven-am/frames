import { TaskEither, Either, createUnauthorizedError } from '@eleven-am/fp';
import { AuthorizationContext } from "@eleven-am/authorizer";
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, Session, User } from '@prisma/client';
import { Response } from 'express';
import { Details } from 'express-useragent';
import { v4 as uuid } from 'uuid';
import { AUTHORIZATION_COOKIE, COOKIE_VALIDITY, GUEST_VALIDITY } from '../authorisation/auth.constants';
import { CacheService } from '../cache/cache.service';
import { HttpService } from '../http/http.service';
import { LanguageService } from '../language/language.service';
import { PrismaService } from '../prisma/prisma.service';

import { SESSION_CACHE_PREFIX, SESSION_COOKIE_NAME, SESSION_CONTEXT_KEY } from './session.constants';
import {
    CachedSession,
    ClientUser,
    Cookie,
    cookieSchema,
    FramesSession,
    LocationSchema,
    TempSession,
} from './session.contracts';


@Injectable()
export class SessionService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly cacheStore: CacheService,
        private readonly httpService: HttpService,
        private readonly languageService: LanguageService,
    ) {}

    createSession (agent: Details, ip: string, res: Response, user: User) {
        const validDate = user.role === Role.GUEST
            ? new Date(Date.now() + GUEST_VALIDITY)
            : new Date(Date.now() + COOKIE_VALIDITY);

        return TaskEither
            .tryCatch(
                () => this.prisma.session.create({
                    data: {
                        browserId: uuid(),
                        session: uuid(),
                        valid: validDate,
                        user: { connect: { id: user.id } },
                    },
                    include: { user: true },
                }),
                'Failed to create session',
            )
            .chain((session) => this.storeDeviceAndLocation(agent, ip, session))
            .ioSync((session) => this.writeHttpCookie(res, session.token));
    }

    removeSession (userId: string, sessionId: string, res?: Response) {
        return TaskEither
            .tryCatch(
                () => this.prisma.session.delete({
                    where: { id: sessionId },
                }),
                'Failed to remove session',
            )
            .chain(() => this.cacheStore.del!(`${SESSION_CACHE_PREFIX}:${userId}:${sessionId}`))
            .map(() => ({
                message: 'Session removed',
            }))
            .ioSync(() => this.clearHttpCookie(res));
    }

    removeOtherSessions (userId: string, sessionId: string) {
        return this.getSessionCachedKeys(userId)
            .filterItems((key) => key !== `${SESSION_CACHE_PREFIX}:${userId}:${sessionId}`)
            .chainItems((key) => this.cacheStore.del(key))
            .chain(() => TaskEither
                .tryCatch(
                    () => this.prisma.session.deleteMany({
                        where: {
                            userId,
                            id: { not: sessionId },
                        },
                    }),
                    'Failed to remove sessions',
                ));
    }

    removeUserSessions (userId: string) {
        return this.getSessionCachedKeys(userId)
            .chain((keys) => this.cacheStore.del(keys))
            .chain(() => TaskEither
                .tryCatch(
                    () => this.prisma.session.deleteMany({
                        where: { userId },
                    }),
                    'Failed to remove sessions',
                ));
    }

    updateSession (user: User) {
        const cookie = (session: Session & { user: User }) => Either
            .tryCatch(() => this.languageService.getLanguage(session.user.defaultLang), 'Language not found')
            .map((lang): Cookie => ({
                language: lang.languageName,
                browserId: session.browserId,
                sessionId: session.id,
                userId: session.userId,
                valid: session.valid,
            }))
            .chain((cookie) => Either.tryCatch(() => this.jwtService.sign(cookie), 'Failed to sign cookie'));

        return TaskEither
            .tryCatch(
                () => this.prisma.session.findMany({
                    where: { userId: user.id },
                    include: { user: true },
                }),
                'Failed to update session',
            )
            .chainItems((session) => cookie(session).toTaskEither()
                .chain((cookie) => this.saveToCache(session, cookie)))
            .map(([session]) => session)
            .nonNullable('Session not found');
    }

    getSession (session: CachedSession) {
        const deleteGuestSession = (session: CachedSession) => TaskEither
            .of(session)
            .filter(
                (session) => session.user.role === Role.GUEST,
                () => createUnauthorizedError('Session not found'),
            )
            .chain(() => this.removeSession(session.userId, session.id));

        return TaskEither
            .of(session)
            .filter(
                (session) => new Date(session.valid).getTime() > Date.now(),
                () => createUnauthorizedError('Session expired'),
            )
            .io(deleteGuestSession)
            .filter(
                (session) => session.user.role !== Role.GUEST,
                () => createUnauthorizedError('Guest session not allowed'),
            )
            .map((session): ClientUser => ({
                role: session.user.role,
                email: session.user.email,
                channel: session.user.channel,
                browserId: session.browserId,
                username: session.user.username,
                incognito: session.user.incognito,
            }));
    }

    retrieveUser (context: AuthorizationContext) {
        const token: string | null = context.isHttp ?
            context.getRequest().cookies[AUTHORIZATION_COOKIE] ??
            context.getRequest().query.token ??
            context.getRequest().headers.authorization ?? null :
            context.getSocketContext().connection?.cookies[AUTHORIZATION_COOKIE] ??
            context.getSocketContext().user?.assigns.token ?? null;

        const sessionToken = token?.replace('Bearer', '').trim() || null;

        return TaskEither
            .fromNullable(sessionToken)
            .ioSync((token) => context.addData(SESSION_COOKIE_NAME, token))
            .chain((token) => this.retrieveSession(token))
            .ioSync((session) => context.addData(SESSION_CONTEXT_KEY, session))
            .map((session) => session.user);
    }

    allowNoRulesAccess (context: AuthorizationContext) {
        return TaskEither
            .of(context)
            .filter(
                (context) => context.isHttp,
                () => createUnauthorizedError('User is not authenticated'),
            )
            .map(() => true);
    }

    private retrieveSession (sessionToken: string) {
        return Either.tryCatch(() => this.jwtService.verify<Cookie>(sessionToken), 'Invalid token')
            .chain((cookie) => Either.tryCatch(() => cookieSchema.parse(cookie), 'Invalid cookie'))
            .toTaskEither()
            .chain(({ userId, sessionId }) => this.cacheStore.get<TempSession>(`${SESSION_CACHE_PREFIX}:${userId}:${sessionId}`))
            .map((session) => Either.tryCatch(() => this.languageService.getLanguage(session.user.defaultLang), 'Language not found')
                .map((lang): CachedSession => ({
                    ...session,
                    language: lang,
                })))
            .chain((session) => session.toTaskEither())
            .mapError(() => createUnauthorizedError('User is not authenticated'));
    }

    private writeHttpCookie (res: Response, token: string) {
        res.cookie(AUTHORIZATION_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_VALIDITY,
            path: '/',
        });
    }

    private clearHttpCookie (res?: Response) {
        res?.clearCookie(AUTHORIZATION_COOKIE, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
    }

    private storeDeviceAndLocation (agent: Details, ip: string, session: Session & { user: User }) {
        const language = this.httpService.getSafe(`http://ip-api.com/json/${ip}`, LocationSchema)
            .chain((location) => TaskEither
                .tryCatch(
                    () => this.prisma.userIdentifier.create({
                        data: {
                            address: ip,
                            osName: agent.os,
                            city: location.city,
                            country: location.country,
                            browserName: agent.browser,
                            region: location.regionName,
                            session: { connect: { id: session.id } },
                            user: { connect: { id: session.userId } },
                        },
                    }),
                    'Failed to store device and location',
                ));

        const cookie = Either
            .tryCatch(() => this.languageService.getLanguage(session.user.defaultLang), 'Language not found')
            .map((lang): Cookie => ({
                language: lang.languageName,
                browserId: session.browserId,
                sessionId: session.id,
                userId: session.userId,
                valid: session.valid,
            }))
            .chain((cookie) => Either.tryCatch(() => this.jwtService.sign(cookie), 'Failed to sign cookie'))
            .toTaskEither();

        return cookie
            .io(() => language)
            .chain((cookie) => this.saveToCache(session, cookie));
    }

    private saveToCache (session: Session & { user: User }, cookie: string) {
        return this.cacheStore.set(
            `${SESSION_CACHE_PREFIX}:${session.userId}:${session.id}`,
            session,
            Math.floor((session.valid.getTime() - Date.now()) / 1000),
        )
            .map((): ClientUser => ({
                role: session.user.role,
                email: session.user.email,
                channel: session.user.channel,
                browserId: session.browserId,
                username: session.user.username,
                incognito: session.user.incognito,
            }))
            .map((user): FramesSession => ({
                token: cookie,
                user,
            }));
    }

    private getSessionCachedKeys (userId: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.session.findMany({
                    where: { userId },
                    select: { id: true },
                }),
                'Failed to get session keys',
            )
            .mapItems((session) => `${SESSION_CACHE_PREFIX}:${userId}:${session.id}`);
    }
}
