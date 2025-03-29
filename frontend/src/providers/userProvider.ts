import { Api } from '@/api/Api';
import {
    ClientUserSchema,
    HttpExceptionSchema,
    OauthSlimClientSchema,
    SessionSchema,
    EmailResponseSchema,
} from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { ApiProvider } from '@/providers/apiProvider';
import { authStore, AuthProcess } from '@/providers/authStore';
import { sleep } from '@/utils/helpers';
import { openWindow } from '@/utils/popUp';
import { hasError } from '@eleven-am/fp';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';

interface UserState {
    session: ClientUserSchema | null;
    loading: boolean;
    token: string | null;
}

interface UpdateUser {
    inform?: boolean;
    incognito?: boolean;
    autoplay?: boolean;
    language?: string;
}

enum OauthAction {
    AUTH_KEY = 'auth_key',
    LOGIN = 'login',
}

interface OauthSuccess {
    action: OauthAction.LOGIN;
    session: SessionSchema;
}

interface OauthFail {
    action: OauthAction.AUTH_KEY;
    token: string;
}

type OauthResponse = OauthSuccess | OauthFail;

class UserNotifier extends ApiProvider<UserState> {
    #oauthToken: string | null;

    constructor () {
        super({
            session: null,
            loading: true,
            token: null,
        });

        void this.#init();
        this.#oauthToken = null;
    }

    async register (email: string, username: string, password: string, authKey: string) {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerRegister({
            email,
            username,
            password,
            authKey,
        }));

        if (response === null) {
            return;
        }

        authStore.updateVerification(response);
    }

    async login (email: string, password: string) {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerLogin({
            email,
            password,
        }));

        if (response !== null) {
            await this.#manageAmbiguousSession(response);
        }
    }

    async continueAsGuest () {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerCreateGuestSession());

        if (response !== null) {
            await this.#setUser(response);
        }
    }

    async oauthRegister (client: OauthSlimClientSchema) {
        this.#load();
        authStore.setError(null);
        const callbackUrl = `/api/auth/${client.id}/authenticate`;
        const popUpData = await openWindow<OauthResponse>(callbackUrl, client.buttonLabel);

        if (hasError(popUpData)) {
            authStore.setError(popUpData.error.message);
            this.#unload();

            return;
        }

        if (popUpData.data.action === OauthAction.AUTH_KEY) {
            this.#oauthToken = popUpData.data.token;
            authStore.processForward(AuthProcess.AuthKey);
            this.#unload();

            return;
        }

        await this.#setUser(popUpData.data.session);
    }

    async updateOauthUser (authKey: string) {
        this.#load();

        if (this.#oauthToken === null) {
            await sleep(500);
            authStore.setError('Invalid token provided');
            this.#unload();

            return;
        }

        const response = await this.#unWrap((client) => client.authControllerValidateOauthAccount({
            authKey,
            token: this.#oauthToken!,
        }));

        if (response !== null) {
            await this.#setUser(response);
        }
    }

    async logout () {
        this.#load();
        this.updateState({
            session: null,
            token: null,
        });
        await this.apiAction((client) => client.authControllerLogout());
        this.#unload();
    }

    async forgotPassword (email: string) {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerResetPassword({
            email,
        }));

        if (response !== null) {
            authStore.updateVerification(response);
        }
    }

    async resetPassword (password: string, token: string | null) {
        this.#load();
        if (token === null) {
            await sleep(500);
            authStore.setError('Invalid token provided');
            this.#unload();

            return null;
        }

        const response = await this.#unWrap((client) => client.authControllerResetPasswordConfirm({
            password,
            token,
        }));

        if (response !== null) {
            await this.#setUser(response);
        }
    }

    async confirmEmail (email: string) {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerIsEmailAvailable(email));

        if (response === null) {
            return;
        }

        authStore.processForward(response ? AuthProcess.Create : AuthProcess.Password);
    }

    async updateUser (update: UpdateUser) {
        if (!this.state.session) {
            return;
        }

        if (update.incognito !== undefined) {
            this.updateState({
                session: {
                    ...this.state.session,
                    incognito: update.incognito,
                },
            });
        }

        await this.apiAction((client) => {
            if (update.language !== undefined) {
                return client.usersControllerUpdateLanguage(update.language);
            }

            return client.usersControllerUpdateUserData({
                inform: update.inform,
                incognito: update.incognito,
                autoplay: update.autoplay,
            });
        });
    }

    async resendVerification (email: string) {
        this.#load();
        const response = await this.#unWrap((client) => client.authControllerResendVerificationEmail({
            email,
        }));

        if (response !== null) {
            authStore.updateVerification(response);
        }
    }

    async registerWebAuthn (email: string, username: string, authKey: string) {
        this.#load();
        const query = {
            email,
            username,
            authKey,
        };

        const startOptions = await this.#unWrap((client) => client.authControllerRegisterWebAuthn(query));

        if (startOptions === null) {
            return;
        }

        const params = await startRegistration({
            optionsJSON: startOptions as PublicKeyCredentialCreationOptionsJSON,
        });

        const session = await this.#unWrap((client) => client.authControllerRegisterWebAuthnConfirm(query, params));

        if (session !== null) {
            authStore.updateVerification(session);
        }
    }

    async loginWebAuthn (email: string) {
        this.#load();
        if (!email) {
            await sleep(500);
            authStore.setError('Invalid email provided');
            this.#unload();

            return;
        }

        const noUserExists = await this.#unWrap((client) => client.authControllerIsEmailAvailable(email));

        if (noUserExists === null) {
            return;
        }

        if (noUserExists) {
            await sleep(500);
            authStore.processForward(AuthProcess.RegisterAuthN);
            this.#unload();

            return;
        }

        const hasAnyKeys = await this.#unWrap((client) => client.authControllerIsPasskeyConfigured(email));

        if (hasAnyKeys === null) {
            return;
        }

        if (hasAnyKeys) {
            const startOptions = await this.#unWrap((client) => client.authControllerLoginWebAuthn({
                email,
            }));

            if (startOptions === null) {
                return;
            }

            const params = await startAuthentication({
                optionsJSON: startOptions,
            });
            const session = await this.#unWrap((client) => client.authControllerLoginWebAuthnConfirm(params));

            if (session !== null) {
                return this.#manageAmbiguousSession(session);
            }
        }

        const startOptions = await this.#unWrap((client) => client.authControllerRegisterWebAuthn({
            email,
        }));

        if (startOptions === null) {
            return;
        }

        const params = await startRegistration({
            optionsJSON: startOptions as PublicKeyCredentialCreationOptionsJSON,
        });
        const session = await this.#unWrap((client) => client.authControllerCreateFirstPassKey(params));

        if (session !== null) {
            return this.#manageAmbiguousSession(session);
        }
    }

    async #manageAmbiguousSession (session: SessionSchema | EmailResponseSchema) {
        if ('header' in session) {
            authStore.updateVerification(session);
        } else {
            await this.#setUser(session);
        }
    }

    #load () {
        authStore.load();
    }

    #unload () {
        authStore.unload();
    }

    async #unWrap <T> (action: (client: Api<never>) => Promise<HttpResponse<T, HttpExceptionSchema>>): Promise<T | null> {
        const sleepPromise = sleep(500);
        const promise = this.apiAction(action);
        const [resolve] = await Promise.allSettled([promise, sleepPromise]);

        if (resolve.status === 'rejected') {
            authStore.setError(resolve.reason);
            this.#unload();

            return null;
        }

        const response = resolve.value;

        if (hasError(response)) {
            authStore.setError(response.error.message);
            this.#unload();

            return null;
        }

        authStore.setError(null);

        return response.data;
    }

    async #setUser ({ token, user }: SessionSchema) {
        authStore.processForward(AuthProcess.Success);
        await sleep(2000);
        this.updateState({
            session: user,
            token,
        });
    }

    async #init () {
        if (window.location.pathname === '/setup') {
            return;
        }

        const response = await this.apiAction((client) => client.authControllerGetCurrentUser());

        if (hasError(response)) {
            this.updateState({
                loading: false,
            });

            return;
        }

        this.updateState({
            session: response.data.user,
            token: response.data.token,
            loading: false,
        });
    }
}

export const userStore = new UserNotifier();
export const useUser = userStore.createStateHook();
export const useUserActions = userStore.createActionsHook();

