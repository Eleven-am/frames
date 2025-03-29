import { Body, Controller, Get, Ip, Param, Patch, Post, Query, Res } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    getSchemaPath,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Details } from 'express-useragent';
import { CurrentToken, CurrentSession } from '../authorisation/auth.decorators';
import { RetrieveService } from '../misc/retrieve.service';
import { OauthParams, PassKeyData } from '../oauth/oauth.schema';
import { OauthService } from '../oauth/oauth.service';
import { CachedSession, SessionSchema } from '../session/session.contracts';
import { ApiNotFoundException, ApiOkFramesResponse, ApiUnauthorizedException } from '../utils/utils.decorators';

import {
    EmailParams,
    LoginParams,
    OauthAuthKeyBody,
    OauthCallbackQuery,
    RegisterParams,
    ResetPasswordByEmailParams,
    ResetPasswordParams,
    UsernameParams,
    VerifyEmailParams,
    PassKeyParams,
    AuthenticationResponseValidator,
    RegistrationResponseValidator,
    ActivateWebAuthnParams,
    PublicKeyCredentialCreationOptionsJSONSchema,
    PublicKeyCredentialRequestOptionsJSONSchema,
    EmailResponseSchema,
} from './auth.contracts';
import { ApiEmailResponse, ServerAddress, UserAgent, HostAddress, PassKeySession } from './auth.decorator';
import { AuthService } from './auth.service';


@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
    constructor (
        private readonly authService: AuthService,
        private readonly oauthService: OauthService,
        private readonly retrieveService: RetrieveService,
    ) {}

    @Post('login')
    @ApiUnauthorizedException('Unauthorized')
    @ApiNotFoundException('User not found')
    @ApiOperation({
        summary: 'Logs in a user',
        description: 'Logs in a user with the given credentials',
    })
    @ApiCreatedResponse({
        description: 'User logged in',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(SessionSchema) },
                { $ref: getSchemaPath(EmailResponseSchema) },
            ],
        },
    })
    login (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @Body() loginParams: LoginParams,
        @ServerAddress() endpoint: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.login(ip, agent, loginParams, endpoint, response);
    }

    @Post('register')
    @ApiOperation({
        summary: 'Registers a user',
        description: 'Registers a user with the given credentials',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiEmailResponse({
        action: 'Verification email sent',
        description: 'Registers a user with the given credentials',
        summary: 'Registers a user with the given credentials',
    })
    register (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @ServerAddress() endpoint: string,
        @Body() registerParams: RegisterParams,
    ) {
        return this.authService.register(ip, agent, registerParams, endpoint);
    }

    @Get('verify-email/:token')
    @ApiOkFramesResponse('Email verified')
    @ApiOperation({
        summary: 'Verifies an email',
        description: 'Verifies an email with the given token',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiNotFoundException('User not found')
    @ApiParam({
        name: 'token',
        type: String,
        description: 'The token to verify the email',
    })
    verifyEmail (@Param() emailParams: VerifyEmailParams) {
        return this.authService.verifyEmail(emailParams);
    }

    @Get('is-username-available/:username')
    @ApiParam({
        name: 'username',
        type: String,
        description: 'The username to check',
    })
    @ApiOkResponse({
        description: 'Username is available',
        schema: {
            type: 'boolean',
        },
    })
    @ApiOperation({
        summary: 'Checks if a username is available',
        description: 'Checks if a username is available',
    })
    isUsernameAvailable (@Param() usernameParams: UsernameParams) {
        return this.authService.isUsernameAvailable(usernameParams);
    }

    @Get('is-email-available/:email')
    @ApiParam({
        name: 'email',
        type: String,
        description: 'The email to check',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiOkResponse({
        description: 'Email is available',
        schema: {
            type: 'boolean',
        },
    })
    @ApiOperation({
        summary: 'Checks if an email is available',
        description: 'Checks if an email is available',
    })
    isEmailAvailable (@Param() emailParams: EmailParams) {
        return this.authService.isEmailAvailable(emailParams);
    }

    @Get('is-passkey-configured/:email')
    @ApiParam({
        name: 'email',
        type: String,
        description: 'The email to check',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiOkResponse({
        description: 'Passkey is configured',
        schema: {
            type: 'boolean',
        },
    })
    @ApiOperation({
        summary: 'Checks if an email has a passkey configured',
        description: 'Checks if an email has a passkey configured',
    })
    isPasskeyConfigured (@Param() emailParams: EmailParams) {
        return this.authService.isPasskeyRegistered(emailParams.email);
    }

    @Patch('reset-password')
    @ApiUnauthorizedException('Unauthorized')
    @ApiEmailResponse({
        action: 'Password reset email sent',
        description: 'Sends a password reset email',
        summary: 'Sends a password reset email',
    })
    resetPassword (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @ServerAddress() endpoint: string,
        @Body() emailParams: ResetPasswordByEmailParams,
    ) {
        return this.authService.resetPassword(emailParams, ip, agent, endpoint);
    }

    @Patch('resend-verification-email')
    @ApiUnauthorizedException('Unauthorized')
    @ApiEmailResponse({
        action: 'Verification email resent',
        description: 'Resends a verification email',
        summary: 'Resends a verification email',
    })
    resendVerificationEmail (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @ServerAddress() endpoint: string,
        @Body() emailParams: ResetPasswordByEmailParams,
    ) {
        return this.authService.resendVerificationEmail(agent, emailParams, ip, endpoint);
    }

    @Post('reset-password-confirm')
    @ApiCreatedResponse({
        description: 'User registered',
        type: SessionSchema,
    })
    @ApiOperation({
        summary: 'Confirms a password reset',
        description: 'Confirms a password reset with the given token',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiNotFoundException('User not found')
    resetPasswordConfirm (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @Res({ passthrough: true }) response: Response,
        @Body() resetPasswordParams: ResetPasswordParams,
    ) {
        return this.authService.resetPasswordConfirm(ip, agent, response, resetPasswordParams);
    }

    @Get('create-guest-session')
    @ApiCreatedResponse({
        description: 'User registered',
        type: SessionSchema,
    })
    @ApiOperation({
        summary: 'Creates a guest session',
        description: 'Creates a guest session',
    })
    createGuestSession (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.createGuestSession(agent, response, ip);
    }

    @Get('webauthn/enabled')
    @ApiUnauthorizedException('Unauthorized')
    @ApiOkResponse({
        description: 'WebAuthn is enabled',
        schema: {
            type: 'boolean',
        },
    })
    @ApiOperation({
        summary: 'Checks if webauthn is enabled',
        description: 'Checks if webauthn is enabled',
    })
    isWebAuthnEnabled () {
        return this.retrieveService.getWebAuthnEnabled();
    }

    @Patch('webauthn/enabled')
    @ApiUnauthorizedException('Unauthorized')
    @ApiOkResponse({
        description: 'WebAuthn is enabled',
        schema: {
            type: 'boolean',
        },
    })
    @ApiOperation({
        summary: 'Enables webauthn',
        description: 'Enables webauthn',
    })
    enableWebAuthn (@Body() body: ActivateWebAuthnParams) {
        return this.retrieveService.setWebAuthnEnabled(body.activated);
    }

    @Get('webauthn/register')
    @ApiOkResponse({
        description: 'WebAuthn registration initiated',
        type: PublicKeyCredentialCreationOptionsJSONSchema,
    })
    @ApiOperation({
        summary: 'Initiate a webauthn registration',
        description: 'Initiate a webauthn registration',
    })
    @ApiUnauthorizedException('Unauthorized')
    registerWebAuthn (
        @HostAddress() host: string,
        @Query() passKeyParams: EmailParams,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.registerWebAuthn(passKeyParams.email, host, response);
    }

    @Post('webauthn/register')
    @ApiOperation({
        summary: 'Registers a user',
        description: 'Registers a user with the given credentials',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiEmailResponse({
        action: 'Verification email sent',
        description: 'Registers a user with the given credentials',
        summary: 'Registers a user with the given credentials',
    })
    registerWebAuthnConfirm (
        @Ip() ip: string,
        @HostAddress() host: string,
        @UserAgent() agent: Details,
        @ServerAddress() endpoint: string,
        @Query() passKeyParams: PassKeyParams,
        @PassKeySession() passkey: PassKeyData,
        @Body() body: RegistrationResponseValidator,
    ) {
        return this.authService.registerWebAuthnConfirm(
            passKeyParams,
            ip,
            agent,
            passkey,
            body,
            endpoint,
            host,
        );
    }

    @Post('webauthn/create-first-passkey')
    @ApiOperation({
        summary: 'Registers a user',
        description: 'Registers a user with the given credentials',
    })
    @ApiUnauthorizedException('Unauthorized')
    @ApiCreatedResponse({
        description: 'User logged in',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(SessionSchema) },
                { $ref: getSchemaPath(EmailResponseSchema) },
            ],
        },
    })
    createFirstPassKey (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @HostAddress() host: string,
        @ServerAddress() endpoint: string,
        @PassKeySession() passkey: PassKeyData,
        @Body() body: RegistrationResponseValidator,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.createFirstPassKey(
            body,
            passkey,
            ip,
            agent,
            endpoint,
            host,
            response,
        );
    }

    @Get('webauthn/login')
    @ApiOkResponse({
        description: 'WebAuthn login process initiated',
        type: PublicKeyCredentialRequestOptionsJSONSchema,
    })
    @ApiOperation({
        summary: 'Initiate a webauthn login process',
        description: 'Initiate a webauthn login process',
    })
    @ApiUnauthorizedException('Unauthorized')
    loginWebAuthn (
        @HostAddress() host: string,
        @Query() emailParams: EmailParams,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.loginWebAuthn(emailParams.email, host, response);
    }

    @Post('webauthn/login')
    @ApiUnauthorizedException('Unauthorized')
    @ApiNotFoundException('User not found')
    @ApiOperation({
        summary: 'Logs in a user',
        description: 'Logs in a user with the given credentials',
    })
    @ApiCreatedResponse({
        description: 'User logged in',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(SessionSchema) },
                { $ref: getSchemaPath(EmailResponseSchema) },
            ],
        },
    })
    loginWebAuthnConfirm (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @HostAddress() host: string,
        @ServerAddress() endpoint: string,
        @PassKeySession() passkey: PassKeyData,
        @Body() body: AuthenticationResponseValidator,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.loginWebAuthnConfirm(
            body,
            passkey,
            endpoint,
            host,
            ip,
            agent,
            response,
        );
    }

    @Post('logout')
    @ApiBearerAuth()
    @ApiUnauthorizedException('Unauthorized')
    @ApiOkFramesResponse('User logged out')
    @ApiOperation({
        summary: 'Logs out a user',
        description: 'Logs out a user',
    })
    @ApiUnauthorizedException('Unauthorized')
    logout (
        @CurrentSession.HTTP() session: CachedSession,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.logout(session, response);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get the current user',
        description: 'Get the current user',
    })
    @ApiOkResponse({
        description: 'The current user',
        type: SessionSchema,
    })
    @ApiUnauthorizedException('Unauthorized')
    getCurrentUser (
        @CurrentToken.HTTP() token: string,
        @CurrentSession.HTTP() session: CachedSession,
    ) {
        return this.authService.getCurrentUser(token, session);
    }

    @Get(':provider/authenticate')
    @ApiOperation({
        summary: 'Get and redirect to the oauth url',
        description: 'Get and redirect to the oauth url',
    })
    getOauthUrl (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @Param() params: OauthParams,
        @ServerAddress() endpoint: string,
    ) {
        return this.oauthService.generateURL(params.provider, ip, agent, endpoint);
    }

    @Get(':provider/callback')
    @ApiOperation({
        summary: 'Authenticate with oauth',
        description: 'Authenticate the user with the oauth provider',
    })
    @ApiOkResponse({
        description: 'A html page that posts the data to the parent window',
        type: String,
    })
    @ApiUnauthorizedException('Unauthorized')
    getOauthUrlCallback (
        @Param() params: OauthParams,
        @ServerAddress() endpoint: string,
        @Query() query: OauthCallbackQuery,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.oauthService.getOauthData(params.provider, query.code, query.state, endpoint)
            .chain((profile) => this.authService.oauthAuthentication(profile, response));
    }

    @Post('validate-oauth-account')
    @ApiOperation({
        summary: 'Validate an oauth account',
        description: 'Validate an oauth account by providing the auth key and activation token',
    })
    @ApiCreatedResponse({
        description: 'The current user',
        type: SessionSchema,
    })
    @ApiUnauthorizedException('Unauthorized')
    validateOauthAccount (
        @Ip() ip: string,
        @UserAgent() agent: Details,
        @Body() body: OauthAuthKeyBody,
        @Res({ passthrough: true }) response: Response,
    ) {
        return this.authService.validateOauthAccount(ip, agent, body, response);
    }
}
