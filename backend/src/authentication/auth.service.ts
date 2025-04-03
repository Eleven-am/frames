import { createForbiddenError, TaskEither, createBadRequestError } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Role, Session, User } from '@prisma/client';
import {
    GenerateAuthenticationOptionsOpts,
    generateAuthenticationOptions,
    GenerateRegistrationOptionsOpts,
    generateRegistrationOptions,
    VerifyAuthenticationResponseOpts,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
    AuthenticatorTransportFuture,
    AuthenticationResponseJSON,
    RegistrationResponseJSON,
} from '@simplewebauthn/types';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Details } from 'express-useragent';
import { v4 as uuid } from 'uuid';
import { AuthKeyService } from '../authkey/authkey.service';
import { NotificationService } from '../notifications/notification.service';
import { OauthAction, OauthResponseData, PassKeyData } from '../oauth/oauth.schema';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession, FramesSession, SessionSchema } from '../session/session.contracts';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';

import { WEB_AUTHN_CACHE_KEY } from './auth.constants';
import {
    EmailParams,
    LoginParams,
    OauthAuthKeyBody,
    RegisterParams,
    ResetPasswordByEmailParams,
    ResetPasswordParams,
    UsernameParams,
    VerifyEmailParams,
    PassKeyParams,
    EmailResponseSchema,
} from './auth.contracts';


@Injectable()
export class AuthService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly authKeyService: AuthKeyService,
        private readonly userService: UsersService,
        private readonly sessionService: SessionService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * @description Login with email and password
     * @param ip - The ip address
     * @param agent - The user agent
     * @param params - The login parameters
     * @param serverAddress - The server address
     * @param response - The response
     * @param isSecure - The secure flag checking if the request is secure (https)
     */
    login (ip: string, agent: Details, params: LoginParams, serverAddress: string, response: Response, isSecure: boolean) {
        return this.userService.findByEmail(params.email, false)
            .chain((user) => TaskEither
                .tryCatch(
                    () => bcrypt.compare(params.password, user.password),
                    'Failed to compare password',
                )
                .filter(
                    (isMatch) => isMatch,
                    () => createForbiddenError('Invalid password'),
                )
                .chain(() => this.createSessionOrSendEmail(user, ip, agent, response, serverAddress, isSecure)));
    }

    /**
     * @description Create a new account, using email and password
     * @param ip - The ip address of the client
     * @param agent - The user agent of the client
     * @param params - The create account parameters
     * @param endpoint - The endpoint of the server
     */
    register (ip: string, agent: Details, params: RegisterParams, endpoint: string) {
        const deviceName = `${agent.browser} ${agent.version}, ${agent.platform} ${agent.os}`;

        return this.verifyRegisterParams(params)
            .chain((params) => TaskEither
                .tryCatch(
                    () => this.prisma.user.create({
                        data: {
                            email: params.email,
                            username: params.username,
                            password: params.password,
                            role: Role.USER,
                            confirmedEmail: false,
                            confirmToken: uuid(),
                        },
                    }),
                    'Failed to create user',
                ))
            .chain((user) => this.authKeyService.revokeAuthKey(params.authKey, user.id)
                .chain(() => this.notificationService.sendVerificationEmail(user, ip, deviceName, endpoint)));
    }

    /**
     * @description Register a user with oauth
     * @param params - The oauth response data
     * @param response - The response
     * @param isSecure - The secure flag checking if the request is secure (https)
     */
    oauthAuthentication (params: OauthResponseData, response: Response, isSecure: boolean) {
        const generateHTML = <T extends object>(params: T) => `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Frames OAuth</title>
                    <meta charset="UTF-8" />
                </head>
                <body>
                    <div>Redirecting...</div>
                    <script>
                        const message = JSON.parse('${JSON.stringify(params)}');
                        const sendMessage = (message) => {
                            try {
                                window.opener.postMessage(message, '*');
                            } catch (e) {
                                console.log(e);
                            } finally {
                                window.close();
                            }
                        };
                        
                        window.onload = () => sendMessage(message);
                    </script>
                </body>
            </html>
        `;

        const updateUserToken = (user: User) => TaskEither
            .tryCatch(
                () => this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        confirmToken: uuid(),
                    },
                }),
                'Failed to update user token',
            )
            .map(({ confirmToken }) => ({
                token: confirmToken,
                action: OauthAction.AUTH_KEY,
            }))
            .map(generateHTML);

        const createUser = (params: OauthResponseData) => TaskEither
            .tryCatch(
                () => this.prisma.user.create({
                    data: {
                        password: uuid(),
                        role: Role.OAUTH,
                        email: params.email,
                        username: params.username,
                        confirmedEmail: false,
                    },
                }),
                'Failed to create user',
            )
            .chain((user) => updateUserToken(user));

        const createSession = (params: OauthResponseData, user: User) => this
            .sessionService
            .createSession(params.details, params.ip, response, user, isSecure)
            .map((session) => ({
                session,
                action: OauthAction.LOGIN,
            }))
            .map(generateHTML);

        const manageExistingUser = (user: User) => TaskEither
            .of(user)
            .filter(
                (user) => !user.revoked,
                () => createForbiddenError('User is revoked'),
            )
            .matchTask([
                {
                    predicate: (user) => user.confirmedEmail,
                    run: () => createSession(params, user),
                },
                {
                    predicate: (user) => !user.confirmedEmail,
                    run: (user) => updateUserToken(user),
                },
            ]);

        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { email: params.email },
                }),
                'Failed to find user by email',
            )
            .matchTask([
                {
                    predicate: (user) => !user,
                    run: () => createUser(params),
                },
                {
                    predicate: (user) => Boolean(user),
                    run: (user) => manageExistingUser(user!),
                },
            ]);
    }

    /**
     * @description Validate the oauth account
     * @param ip - The ip address
     * @param agent - The user agent
     * @param params - The oauth account parameters
     * @param response - The response
     * @param isSecure - The secure flag checking if the request is secure (https)
     */
    validateOauthAccount (ip: string, agent: Details, params: OauthAuthKeyBody, response: Response, isSecure: boolean) {
        return this.authKeyService.findByAuthKey(params.authKey)
            .chain(() => this.userService.findByToken(params.token))
            .filter(
                (user) => !user.confirmedEmail && user.role === Role.OAUTH,
                () => createForbiddenError('User is not an oauth user'),
            )
            .filter(
                (user) => !user.revoked,
                () => createForbiddenError('User is revoked'),
            )
            .chain((user) => this.authKeyService.revokeAuthKey(params.authKey, user.id))
            .chain((authKey) => TaskEither
                .tryCatch(
                    () => this.prisma.user.update({
                        where: { id: authKey.userId },
                        data: {
                            confirmedEmail: true,
                            confirmToken: null,
                        },
                    }),
                    'Failed to update user',
                ))
            .chain((user) => this.sessionService.createSession(agent, ip, response, user, isSecure));
    }

    /**
   * @description Verify the email address
   * @param params -  The verify email parameters
   */
    verifyEmail (params: VerifyEmailParams) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findFirst({ where: { confirmToken: params.token } }),
                'Failed to find user by token',
            )
            .nonNullable('User not found')
            .chain((user) => TaskEither
                .tryCatch(
                    () => this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            confirmedEmail: true,
                            confirmToken: null,
                        },
                    }),
                    'Failed to update user',
                ))
            .map(() => ({
                message: 'Email verified',
            }));
    }

    /**
   * @description Check if the email is available, ie no other user has this email
   * @param params - The email parameters
   */
    isEmailAvailable (params: EmailParams) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({ where: { email: params.email } }),
                'Failed to find user',
            )
            .map((user) => !user);
    }

    /**
   * @description Check if the username is available, ie no other user has this username
   * @param params - The username parameters
   */
    isUsernameAvailable (params: UsernameParams) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({ where: { username: params.username } }),
                'Failed to find user',
            )
            .map((user) => !user);
    }

    /**
     * @description Reset the password, by sending an email
     * @param params - The reset password parameters
     * @param ip - The ip address
     * @param agent - The user agent
     * @param endpoint - The endpoint of the server
     */
    resetPassword (params: ResetPasswordByEmailParams, ip: string, agent: Details, endpoint: string) {
        const deviceName = `${agent.browser} ${agent.version}, ${agent.platform} ${agent.os}`;

        return this.createToken(params)
            .chain((user) => this.notificationService.sendPasswordResetEmail(user, ip, deviceName, endpoint));
    }

    /**
     * @description Sends a verification email to the user
     * @param agent - The user agent
     * @param params - The resend verification parameters
     * @param ip - The ip address
     * @param endpoint - The endpoint of the server
     */
    resendVerificationEmail (agent: Details, params: ResetPasswordByEmailParams, ip: string, endpoint: string) {
        const deviceName = `${agent.browser} ${agent.version}, ${agent.platform} ${agent.os}`;

        return this.createToken(params, false)
            .chain((user) => this.notificationService.sendVerificationEmail(user, ip, deviceName, endpoint));
    }

    /**
   * @description Reset the password, by confirming the token
   * @param ip - The ip address
   * @param agent - The user agent
   * @param response - The response
   * @param params - The reset password confirm parameters
   * @param isSecure - The secure flag checking if the request is secure (https)
   */
    resetPasswordConfirm (ip: string, agent: Details, response: Response, params: ResetPasswordParams, isSecure: boolean) {
        return this.userService.findByToken(params.token)
            .chain((user) => TaskEither
                .tryCatch(
                    () => bcrypt.hash(params.password, 10),
                    'Failed to hash password',
                )
                .map((password) => ({
                    ...user,
                    password,
                })))
            .chain((user) => TaskEither
                .tryCatch(
                    () => this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            password: user.password,
                            confirmToken: null,
                        },
                    }),
                    'Failed to update user',
                )
                .chain(() => this.sessionService.createSession(agent, ip, response, user, isSecure)));
    }

    /**
   * @description Create a new guest session
   * @param agent - The user agent
   * @param response - The response
   * @param ip - The ip address
   * @param isSecure - The secure flag checking if the request is secure (https)
   */
    createGuestSession (agent: Details, response: Response, ip: string, isSecure: boolean) {
        const username = Date.now()
            .toString(36) + Math.random()
            .toString(36)
            .substr(2);
        const password = uuid();
        const email = `${username}@frames.local`;

        return TaskEither
            .tryCatch(
                () => this.prisma.user.create({
                    data: {
                        email,
                        username,
                        password,
                        role: Role.GUEST,
                        confirmedEmail: true,
                    },
                }),
                'Failed to create user',
            )
            .chain((user) => this.sessionService.createSession(agent, ip, response, user, isSecure));
    }

    /**
   * @description Logout the user
   * @param session - The session to logout
   * @param response - The response
   */
    logout (session: Session, response: Response) {
        return this.sessionService.removeSession(session.userId, session.id, response);
    }

    /**
     * @description Get the current user
     * @param token - The token
     * @param session - The session
     * @param response - The response
     */
    getCurrentUser (token: string, session: CachedSession, response: Response) {
        return this.sessionService.getSession(session, response)
            .map((user): FramesSession => ({
                token,
                user,
            }));
    }

    /**
   * @description Login with webauthn
   * @param email - The email address
   * @param hostname - The hostname
   * @param response - The response
   */
    loginWebAuthn (email: string, hostname: string, response: Response) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { email },
                    include: {
                        passKeys: true,
                    },
                }),
                'Error retrieving user',
            )
            .nonNullable('User not found')
            .map((user) => user.passKeys)
            .mapItems((passKey) => ({
                id: passKey.credentialId,
                type: passKey.publicKey,
                transports: passKey.transports as AuthenticatorTransportFuture[],
            }))
            .map((allowCredentials): GenerateAuthenticationOptionsOpts => ({
                allowCredentials,
                userVerification: 'preferred',
                rpID: hostname,
                timeout: 60000,
            }))
            .chain((opts) => TaskEither
                .tryCatch(
                    () => generateAuthenticationOptions(opts),
                    'Error generating registration options',
                ))
            .ioSync((options) => {
                response.cookie(
                    WEB_AUTHN_CACHE_KEY,
                    Buffer.from(JSON.stringify({
                        challenge: options.challenge,
                        email,
                    })).toString('base64'),
                    {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 60 * 1000,
                        path: '/',
                    },
                );
            });
    }

    /**
   * @description Register with webauthn
   * @param email - The email address
   * @param hostname - The hostname
   * @param response - The response
   */
    registerWebAuthn (email: string, hostname: string, response: Response) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { email },
                    include: {
                        passKeys: true,
                    },
                }),
                'Error retrieving user',
            )
            .nonNullable('User not found')
            .map((user) => user.passKeys)
            .orElse(() => TaskEither.of([]))
            .mapItems((passKey) => ({
                id: passKey.credentialId,
                type: passKey.publicKey,
                transports: passKey.transports as AuthenticatorTransportFuture[],
            }))
            .map((excludeCredentials) => {
                const opts: GenerateRegistrationOptionsOpts = {
                    rpName: 'Frames - Watch FREE TV Shows and Movies Online',
                    rpID: hostname,
                    userName: email,
                    timeout: 60000,
                    attestationType: 'none',
                    excludeCredentials,
                    supportedAlgorithmIDs: [-7, -257, -8],
                    authenticatorSelection: {
                        residentKey: 'discouraged',
                        userVerification: 'preferred',
                    },
                    extensions: {
                        appid: hostname,
                    },
                };

                return opts;
            })
            .chain((opts) => TaskEither
                .tryCatch(
                    () => generateRegistrationOptions(opts),
                    'Error generating registration options',
                ))
            .ioSync((options) => {
                response.cookie(
                    WEB_AUTHN_CACHE_KEY,
                    Buffer.from(JSON.stringify({
                        challenge: options.challenge,
                        email,
                    })).toString('base64'),
                    {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 60 * 1000,
                        path: '/',
                    },
                );
            });
    }

    /**
   * @description Verify the webauthn login
   * @param body - The authentication response
   * @param passKeyData - The pass key data
   * @param serverAddress - The server address
   * @param hostname - The hostname
   * @param ip - The ip address
   * @param agent - The user agent
   * @param response - The response object
   * @param isSecure - The secure flag checking if the request is secure (https)
   */
    loginWebAuthnConfirm (
        body: AuthenticationResponseJSON,
        passKeyData: PassKeyData, serverAddress: string,
        hostname: string, ip: string, agent: Details,
        response: Response, isSecure: boolean,
    ) {
        return TaskEither
            .tryCatch(
                () => this.prisma.passKey.findUnique({
                    where: {
                        passKeyIndex: {
                            email: passKeyData.email,
                            credentialId: body.id,
                        },
                    },
                }),
                'Error retrieving pass key',
            )
            .nonNullable('Pass key not found')
            .map((passKey): VerifyAuthenticationResponseOpts => ({
                response: body,
                expectedRPID: hostname,
                expectedOrigin: serverAddress,
                requireUserVerification: false,
                expectedChallenge: passKeyData.challenge,
                credential: {
                    counter: passKey.counter,
                    id: passKey.credentialId,
                    publicKey: this.base64ToUint8Array(passKey.publicKey),
                    transports: passKey.transports as AuthenticatorTransportFuture[],
                },
            }))
            .chain((opts) => TaskEither
                .tryCatch(
                    () => verifyAuthenticationResponse(opts),
                    'Error verifying authentication response',
                ))
            .filter(
                (response) => response.verified,
                () => createBadRequestError('WebAuthn login failed'),
            )
            .chain(({ authenticationInfo }) => TaskEither
                .tryCatch(
                    () => this.prisma.passKey.update({
                        where: {
                            passKeyIndex: {
                                email: passKeyData.email,
                                credentialId: body.id,
                            },
                        },
                        data: {
                            counter: authenticationInfo.newCounter,
                        },
                        include: {
                            user: true,
                        },
                    }),
                    'Error retrieving user',
                ))
            .map((passKey) => passKey.user)
            .chain((user) => this.createSessionOrSendEmail(user, ip, agent, response, serverAddress, isSecure));
    }

    /**
   * @description Verify the webauthn registration
   * @param params - The pass key parameters
   * @param passKeyData - The pass key data
   * @param body - The registration response
   * @param serverAddress - The server address
   * @param hostname - The hostname
   * @param ip - The ip address
   * @param agent - The user agent
   */
    registerWebAuthnConfirm (
        params: PassKeyParams,
        ip: string, agent: Details,
        passKeyData: PassKeyData,
        body: RegistrationResponseJSON,
        serverAddress: string, hostname: string,
    ) {
        const confirmToken = uuid();
        const deviceName = `${agent.browser} ${agent.version}, ${agent.platform} ${agent.os}`;

        return TaskEither
            .of({
                password: uuid(),
                email: params.email,
                authKey: params.authKey,
                username: params.username,
            })
            .chain((params) => this.verifyRegisterParams(params))
            .chain((params) => TaskEither
                .tryCatch(
                    () => this.prisma.user.create({
                        data: {
                            email: params.email,
                            username: params.username,
                            password: params.password,
                            role: Role.USER,
                            confirmedEmail: false,
                            confirmToken,
                        },
                    }),
                    'Failed to create user',
                ))
            .chain((user) => this.authKeyService.revokeAuthKey(params.authKey, user.id).map(() => user))
            .chain((user) => this.verifyPasskey(body, passKeyData, serverAddress, hostname, user)
                .ioError(() => TaskEither.tryCatch(() => this.prisma.user.delete({ where: { id: user.id } }))))
            .chain((user) => this.notificationService.sendVerificationEmail(user, ip, deviceName, serverAddress));
    }

    /**
   * @description Create the first pass key for an already authenticated user
   * @param body - The registration response
   * @param passKeyData - The pass key data
   * @param ip - The ip address
   * @param agent - The user agent
   * @param serverAddress - The server address
   * @param hostname - The hostname
   * @param response - The response
   * @param isSecure - The secure flag checking if the request is secure (https)
   */
    createFirstPassKey (
        body: RegistrationResponseJSON,
        passKeyData: PassKeyData, ip: string,
        agent: Details, serverAddress: string,
        hostname: string, response: Response, isSecure: boolean,
    ) {
        return this.userService.findByEmail(passKeyData.email)
            .chain((user) => this.verifyPasskey(body, passKeyData, serverAddress, hostname, user))
            .chain((user) => this.createSessionOrSendEmail(user, ip, agent, response, serverAddress, isSecure));
    }

    /**
     * @description Check if the user with the email has a passkey registered
     * @param email - The email address
     */
    isPasskeyRegistered (email: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findUnique({
                    where: { email },
                    include: {
                        passKeys: true,
                    },
                }),
                'Error retrieving user',
            )
            .nonNullable('User not found')
            .map((user) => user.passKeys.length > 0);
    }

    private createSessionOrSendEmail (user: User, ip: string, agent: Details, response: Response, endpoint: string, isSecure: boolean) {
        const deviceName = `${agent.browser} ${agent.version}, ${agent.platform} ${agent.os}`;

        return TaskEither
            .of(user)
            .filter(
                (user) => !user.revoked,
                () => createForbiddenError('User is revoked'),
            )
            .matchTask([
                {
                    predicate: (user) => user.confirmedEmail,
                    run: (user): TaskEither<EmailResponseSchema | SessionSchema> => this.sessionService.createSession(agent, ip, response, user, isSecure),
                },
                {
                    predicate: (user) => !user.confirmedEmail,
                    run: (user) => this.notificationService.sendVerificationEmail(user, ip, deviceName, endpoint),
                },
            ]);
    }

    private createToken (params: EmailParams, validateAccount = true) {
        return this.userService.findByEmail(params.email, validateAccount)
            .chain((user) => TaskEither
                .tryCatch(
                    () => this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            confirmToken: uuid(),
                        },
                    }),
                    'Failed to update user',
                ));
    }

    private verifyRegisterParams (params: RegisterParams) {
        return this.userService.findByEmail(params.email)
            .flip(
                () => params,
                () => createForbiddenError('Email already exists'),
            )
            .chain((params) => this.userService.findByUsername(params.username))
            .flip(
                () => params,
                () => createForbiddenError('Username already exists'),
            )
            .chain((params) => this.authKeyService.findByAuthKey(params.authKey))
            .map(() => params)
            .chain((params) => TaskEither
                .tryCatch(
                    () => bcrypt.hash(params.password, 10),
                    'Failed to hash password',
                )
                .map((password) => ({
                    ...params,
                    password,
                })));
    }

    private Uint8ArrayToBase64 (arr: Uint8Array): string {
        return btoa(String.fromCharCode(...arr));
    }

    private base64ToUint8Array (base64: string): Uint8Array {
        return new Uint8Array(atob(base64).split('')
            .map((char) => char.charCodeAt(0)));
    }

    private verifyPasskey (body: RegistrationResponseJSON, passKeyData: PassKeyData, serverAddress: string, hostname: string, user: User) {
        const opts = {
            response: body,
            expectedChallenge: passKeyData.challenge,
            expectedOrigin: serverAddress,
            expectedRPID: hostname,
            requireUserVerification: false,
        };

        return TaskEither
            .tryCatch(
                () => verifyRegistrationResponse(opts),
                'Error verifying registration response',
            )
            .filter(
                (response) => response.verified && Boolean(response.registrationInfo),
                () => createBadRequestError('WebAuthn registration failed'),
            )
            .chain((response) => TaskEither
                .tryCatch(
                    () => this.prisma.passKey.upsert({
                        where: {
                            passKeyIndex: {
                                email: passKeyData.email,
                                credentialId: response.registrationInfo!.credential.id,
                            },
                        },
                        update: {},
                        create: {
                            email: passKeyData.email,
                            transports: body.response.transports || [],
                            counter: response.registrationInfo!.credential.counter,
                            credentialId: response.registrationInfo!.credential.id,
                            backedUp: response.registrationInfo!.credentialBackedUp,
                            deviceType: response.registrationInfo!.credentialDeviceType,
                            publicKey: this.Uint8ArrayToBase64(response.registrationInfo!.credential.publicKey),
                        },
                    }),
                )
                .map(() => user));
    }
}
