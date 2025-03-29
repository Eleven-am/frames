import { EmailResponseSchema } from '@/api/data-contracts';
import { FormProvider, ProcessState } from '@/components/processForm';
import { Timer } from '@/utils/timer';
import { hasError, hasData } from '@eleven-am/fp';

export enum AuthProcess {
    Forgot = 'forgot',
    Password = 'password',
    AuthKey = 'authKey',
    Create = 'create',
    Verification = 'verification',
    Success = 'success',
    Unauthorized = 'unauthorized',
    Verified = 'verified',
    RegisterAuthN = 'registerAuthN',
}

interface PassWordState {
    error: boolean;
    password: string;
    passwordConfirm: string;
    passwordVisible: boolean;
    passwordConfirmVisible: boolean;
    passwordValid: boolean;
    passwordConfirmValid: boolean;
}

interface EmailState {
    error: boolean;
    email: string;
}

interface UsernamesState {
    error: boolean;
    username: string;
    available: boolean;
}

interface AuthKeyState {
    error: boolean;
    authKey: string;
    authKeyValid: boolean;
    readonly: boolean;
}

interface AuthSearch {
    reset?: string;
    verify?: string;
    authKey?: string;
}

interface AuthPageProps {
    token: string | null;
    process: AuthProcess;
    authKey: string | null;
}

export interface AuthState {
    password: PassWordState;
    email: EmailState;
    authKey: AuthKeyState;
    username: UsernamesState;
    verification: EmailResponseSchema | null;
    misc: {
        token: string | null;
    };
}

const defaultState: AuthState & ProcessState<AuthProcess> = {
    password: {
        error: false,
        password: '',
        passwordConfirm: '',
        passwordVisible: false,
        passwordConfirmVisible: false,
        passwordValid: false,
        passwordConfirmValid: false,
    },
    email: {
        error: false,
        email: '',
    },
    authKey: {
        error: false,
        authKey: '',
        authKeyValid: false,
        readonly: false,
    },
    username: {
        error: false,
        username: '',
        available: false,
    },
    misc: {
        token: null,
    },
    verification: null,
    loading: false,
    processSequence: [],
    process: AuthProcess.Unauthorized,
    processHistory: [AuthProcess.Unauthorized],
    endProcess: AuthProcess.Success,
    skippableProcesses: [],
    isPrevious: false,
    error: null,
    success: null,
};

class AuthNotifier extends FormProvider<AuthState, AuthProcess> {
    #timer: Timer = new Timer();

    async setAuthKey (authKey: string) {
        if (this.state.authKey.readonly) {
            return null;
        }

        let error: string | null;
        const authKeyValid = false;
        const readonly = this.state.authKey.readonly;

        if (authKey.length === 24) {
            const data = await this.#confirmAuthKey(authKey);

            if (data) {
                error = null;
            } else {
                error = 'Invalid auth key';
            }

            this.updateState({
                authKey: {
                    readonly,
                    authKey,
                    authKeyValid: Boolean(data),
                    error: Boolean(error),
                },
                error,
            });

            return error;
        }

        const rgx = new RegExp(/^[A-Za-z\d]{1,4}$/);
        const nonRgx = new RegExp(/[$-/:-?{-~!"^_`\[\]\s+]/);

        if (authKey === '') {
            error = null;
        } else if (authKey.length > 4) {
            const matches = authKey.split('-').filter((e) => e !== '');
            const matched = matches.every((match) => rgx.test(match) && !nonRgx.test(match));

            error = matched ? null : 'Invalid auth key';
        } else {
            const matched = rgx.test(authKey) && !nonRgx.test(authKey);

            error = matched ? null : 'Invalid auth key';
        }

        this.updateState({
            authKey: {
                authKey,
                authKeyValid,
                readonly,
                error: Boolean(error),
            },
        });

        this.setError(error);
        return error;
    }

    public setEmail (email: string): void {
        let error: string | null;
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/;

        if (email === '') {
            error = null;
        } else if (!emailRegex.test(email)) {
            error = 'Please enter a valid email';
        } else {
            error = null;
        }

        this.updateState({
            email: {
                ...this.state.email,
                email,
                error: Boolean(error),
            },
        });

        this.setError(error);
    }

    public setPassword (password: string): void {
        let error: string | null;
        let passwordValid = false;

        if (password === '') {
            error = null;
        } else if (password.length < 8) {
            error = 'Password must be at least 8 characters';
        } else if (!(/\d/).test(password)) {
            error = 'Password must contain at least one number';
        } else if (!(/[a-z]/).test(password)) {
            error = 'Password must contain at least one lowercase letter';
        } else if (!(/[A-Z]/).test(password)) {
            error = 'Password must contain at least one uppercase letter';
        } else {
            error = null;
            passwordValid = true;
        }

        this.updateState({
            password: {
                ...this.state.password,
                password,
                passwordValid,
                error: Boolean(error),
            },
        });

        this.setError(error);
    }

    public setPasswordConfirm (passwordConfirm: string): void {
        let error: string | null;
        let passwordConfirmValid = false;

        if (passwordConfirm === '') {
            error = null;
        } else if (passwordConfirm !== this.state.password.password) {
            error = 'Passwords do not match';
        } else if (this.state.password.passwordValid) {
            error = null;
            passwordConfirmValid = true;
        } else {
            error = null;
        }

        this.updateState({
            password: {
                ...this.state.password,
                passwordConfirm,
                passwordConfirmValid,
                error: Boolean(error),
            },
        });

        this.setError(error);
    }

    public setUsername (ignoreCheck = false) {
        return (username: string) => {
            if (ignoreCheck) {
                this.updateState({
                    username: {
                        ...this.state.username,
                        username,
                    },
                });

                return;
            }

            this.#timer.clear();

            let error: string | null;
            const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

            if (username === '') {
                error = null;
            } else if (!usernameRegex.test(username)) {
                error = 'Please enter a valid username';
            } else {
                error = null;
            }

            this.updateState({
                username: {
                    ...this.state.username,
                    available: false,
                    username,
                    error: Boolean(error),
                },
            });

            this.setError(error);

            if (error || username === '') {
                return;
            }

            this.#timer.start(() => {
                this.#confirmUsername(username)
                    .then((available) => {
                        this.updateState({
                            username: {
                                ...this.state.username,
                                error: !available,
                                available,
                            },
                        });

                        this.setError(available ? null : 'Username is already taken');
                    });
            }, 500);
        };
    }

    public togglePasswordVisibility (): void {
        this.updateState({
            password: {
                ...this.state.password,
                passwordVisible: !this.state.password.passwordVisible,
            },
        });
    }

    public togglePasswordConfirmVisibility (): void {
        this.updateState({
            password: {
                ...this.state.password,
                passwordConfirmVisible: !this.state.password.passwordConfirmVisible,
            },
        });
    }

    public setServerSetAuthKey (authKey: string | null): void {
        if (authKey !== null && authKey.length === 24) {
            this.updateState({
                authKey: {
                    authKey,
                    readonly: true,
                    authKeyValid: true,
                    error: false,
                },
            });
        }
    }

    public setToken (token: string | null): void {
        this.updateState({
            misc: {
                token,
            },
        });
    }

    public updateVerification (verification: EmailResponseSchema) {
        this.updateState({
            verification,
        });

        this.processForward(AuthProcess.Verification);
    }

    async initProcess (search: AuthSearch): Promise<AuthPageProps> {
        if (search.verify) {
            const verification = await this.#initVerification(search.verify);

            if (verification) {
                return verification;
            }
        }

        if (search.authKey) {
            const authKey = await this.#initAuthKey(search.authKey);

            if (authKey) {
                return authKey;
            }
        }

        if (search.reset) {
            return this.#initReset(search.reset);
        }

        return {
            token: null,
            authKey: null,
            process: AuthProcess.Unauthorized,
        };
    }

    async #initAuthKey (authKey: string) {
        const auth = await this.apiAction((client) => client.authKeyControllerFindByAuthKey(authKey));

        if (hasData(auth)) {
            return {
                token: null,
                process: AuthProcess.Unauthorized,
                authKey: auth.data.authKey,
            };
        }

        return null;
    }

    async #initVerification (verify: string) {
        const auth = await this.apiAction((client) => client.authControllerVerifyEmail(verify));

        if (hasData(auth)) {
            return {
                process: AuthProcess.Verified,
                authKey: null,
                token: null,
            };
        }

        return null;
    }

    #initReset (reset: string) {
        return {
            token: reset,
            process: AuthProcess.Forgot,
            authKey: null,
        };
    }

    async #confirmUsername (username: string) {
        const response = await this.apiAction((client) => client.authControllerIsUsernameAvailable(username));

        if (hasError(response)) {
            this.setError(response.error.message);

            return false;
        }

        return response.data;
    }

    async #confirmAuthKey (authKey: string) {
        const authKeyData = await this.apiAction((client) => client.authKeyControllerFindByAuthKey(authKey));

        if (hasError(authKeyData)) {
            this.setError(authKeyData.error.message);

            return false;
        }

        return !authKeyData.data.revoked;
    }
}

export const authStore = new AuthNotifier(defaultState);
export const useAuthStore = authStore.createStateHook();
export const useAuthStoreActions = authStore.createActionsHook();
