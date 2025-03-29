import { AuthButton, OauthButton, SubmitButton } from '@/components/auth/buttons';
import { AuthKeyInput, EmailInput, PasswordInput, UsernameInput } from '@/components/auth/inputs';
import { ProcessForm, ProcessItemProps } from '@/components/processForm';
import { useAuthStore, useAuthStoreActions, AuthProcess } from '@/providers/authStore';
import { useUserActions } from '@/providers/userProvider';
import { authQueries, authActions } from '@/queries/auth';
import { useAction } from '@eleven-am/xquery';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';


function LoginPassword () {
    const { email, password } = useAuthStore((state) => ({
        email: state.email.email,
        password: state.password.password,
    }));

    const { forgotPasswordActive, resendVerificationActive } = useAuthStore((state) => ({
        forgotPasswordActive: state.error === 'Invalid password',
        resendVerificationActive: state.error === 'Email not confirmed',
    }));

    const { login, forgotPassword, resendVerification } = useUserActions();

    const handleSubmit = useCallback(async () => {
        await login(email, password);
    }, [email, password, login]);

    const forgotPasswordHandler = useCallback(async () => {
        await forgotPassword(email);
    }, [email, forgotPassword]);

    const resendVerificationHandler = useCallback(async () => {
        await resendVerification(email);
    }, [email, resendVerification]);

    return (
        <ProcessForm.Item
            handleSubmit={handleSubmit}
        >
            <PasswordInput
                name={'password'}
                placeholder={'enter your password'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'sign in'}
                    tooltip={'continue with email'}
                />
                {
                    forgotPasswordActive && (
                        <AuthButton
                            type={'button'}
                            className={'text-sm text-gray-400 hover:text-gray-300 bg-darkM hover:bg-darkM/90'}
                            label={'forgot password?'}
                            tooltip={'forgot password?'}
                            handleClick={forgotPasswordHandler}
                        />
                    )
                }
                {
                    resendVerificationActive && (
                        <AuthButton
                            type={'button'}
                            className={'text-sm text-gray-400 hover:text-gray-300 bg-darkM hover:bg-darkM/90'}
                            label={'resend verification email'}
                            tooltip={'resend verification email'}
                            handleClick={resendVerificationHandler}
                        />
                    )
                }
            </div>
        </ProcessForm.Item>
    );
}

function LoginEmailAndOauth () {
    const { data } = useQuery(authQueries.oauthClients);
    const { confirmEmail, loginWebAuthn } = useUserActions();
    const { data: enabled } = useAction(authActions.webAuthnStatus);
    const clients = useMemo(() => data?.results || [], [data]);
    const email = useAuthStore((state) => state.email.email);
    const handleSubmit = useCallback(() => confirmEmail(email), [email, confirmEmail]);
    const handleLoginWebAuthn = useCallback(() => loginWebAuthn(email), [email, loginWebAuthn]);

    return (
        <ProcessForm.Item
            handleSubmit={handleSubmit}
        >
            <EmailInput
                name={'email'}
                placeholder={'enter your email'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'continue with email'}
                    tooltip={'continue with email'}
                />
                <div className={'m-2'}>
                    <div
                        className={'w-full h-0.5 bg-lightest/80 bg-gray-400'}
                    />
                </div>
                {
                    enabled && (
                        <AuthButton
                            type={'button'}
                            className={'text-sm text-gray-400 hover:text-gray-300 bg-darkM hover:bg-darkM/90'}
                            label={'login with passkey'}
                            tooltip={'login with passkey'}
                            handleClick={handleLoginWebAuthn}
                        />
                    )
                }
                {
                    clients.map((client) => (
                        <OauthButton key={client.id} client={client} />
                    ))
                }
            </div>
        </ProcessForm.Item>
    );
}

function CreateAccount () {
    const accountState = useAuthStore();
    const { register } = useUserActions();

    const handleCreateAccount = useCallback(async () => {
        if (accountState.authKey.error || accountState.email.error || accountState.password.error || accountState.username.error) {
            return;
        }

        await register(accountState.email.email, accountState.username.username, accountState.password.password, accountState.authKey.authKey);
    }, [
        accountState.authKey.error,
        accountState.authKey.authKey,
        accountState.email.error,
        accountState.email.email,
        accountState.password.error,
        accountState.password.password,
        accountState.username.error,
        accountState.username.username,
        register,
    ]);

    return (
        <ProcessForm.Item
            handleSubmit={handleCreateAccount}
        >
            <UsernameInput
                name={'username'}
                placeholder={'enter your username'}
            />
            <AuthKeyInput
                name={'auth_code'}
                maxLength={24}
                placeholder={'enter an auth key'}
            />
            <PasswordInput
                name={'password'}
                placeholder={'enter your password'}
            />
            <PasswordInput
                confirmPassword
                name={'password_confirmation'}
                placeholder={'confirm your password'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'create account'}
                    tooltip={'create account'}
                />
            </div>
        </ProcessForm.Item>
    );
}

function ForgotPassword () {
    const { error, password } = useAuthStore((state) => state.password);
    const token = useAuthStore((state) => state.misc.token);
    const { resetPassword } = useUserActions();

    const handleForgotPassword = useCallback(async () => {
        if (error) {
            return;
        }

        await resetPassword(password, token);
    }, [error, resetPassword, password, token]);

    return (
        <ProcessForm.Item
            handleSubmit={handleForgotPassword}
        >
            <PasswordInput
                name={'password'}
                placeholder={'enter your password'}
            />
            <PasswordInput
                confirmPassword
                name={'password_confirmation'}
                placeholder={'confirm your password'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'reset password'}
                    tooltip={'reset password'}
                />
            </div>
        </ProcessForm.Item>
    );
}

function AuthKey () {
    const { authKey, authKeyValid, error, readonly } = useAuthStore((state) => state.authKey);
    const { updateOauthUser } = useUserActions();
    const { load } = useAuthStoreActions();

    const handleAuthKey = useCallback(async () => {
        if (error) {
            return;
        }

        await updateOauthUser(authKey);
    }, [authKey, error, updateOauthUser]);

    const autoUpdate = useCallback(() => {
        if (authKeyValid && readonly && !error) {
            load();
            void updateOauthUser(authKey);
        }
    }, [authKey, authKeyValid, error, load, readonly, updateOauthUser]);

    useEffect(() => autoUpdate(), [autoUpdate]);

    return (
        <ProcessForm.Item
            handleSubmit={handleAuthKey}
        >
            <AuthKeyInput
                name={'auth_code'}
                placeholder={'enter an auth key'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={authKeyValid ? 'create account' : 'enter an auth key'}
                    tooltip={authKeyValid ? 'create account' : 'enter an auth key'}
                />
            </div>
        </ProcessForm.Item>
    );
}

function RegisterWebAuthn () {
    const { registerWebAuthn } = useUserActions();
    const { authKey, username, email, inError } = useAuthStore((state) => ({
        authKey: state.authKey.authKey,
        username: state.username.username,
        email: state.email.email,
        inError: state.email.error || state.username.error || state.authKey.error,
    }));

    const handleRegisterWebAuthn = useCallback(async () => {
        if (inError) {
            return;
        }

        await registerWebAuthn(email, username, authKey);
    }, [authKey, email, inError, registerWebAuthn, username]);

    return (
        <ProcessForm.Item
            handleSubmit={handleRegisterWebAuthn}
        >
            <AuthKeyInput
                name={'auth_code'}
                placeholder={'enter an auth key'}
            />
            <UsernameInput
                name={'username'}
                placeholder={'enter your username'}
            />
            <EmailInput
                name={'email'}
                placeholder={'enter your email'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'register'}
                    tooltip={'register'}
                />
            </div>
        </ProcessForm.Item>
    );
}

function VerificationText () {
    const { loading } = useAuthStore();
    const verification = useAuthStore((state) => state.verification);

    return (
        <ProcessForm.Item
            hideForm
        >
            <div
                className={`h-3/5 w-5/6 flex flex-col justify-center items-center text-lightL transition-opacity duration-500 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}
            >
                <div className={'text-2xl font-bold text-center'}>
                    {verification?.header}
                </div>
                <div className={'text-xl font-bold text-center'}>
                    {verification?.text}
                </div>
            </div>
        </ProcessForm.Item>
    );
}

function Success () {
    return (
        <ProcessForm.Item />
    );
}

function LoginAfterVerification () {
    const { email, password } = useAuthStore();
    const { login } = useUserActions();

    const handleLogin = useCallback(async () => {
        if (email.error || password.error) {
            return;
        }

        await login(email.email, password.password);
    }, [email.error, email.email, password.error, password.password, login]);

    const noErrors = useMemo(() => !email.error && !password.error, [email.error, password.error]);

    return (
        <ProcessForm.Item
            handleSubmit={handleLogin}
            success={'Your account has been verified!'}
        >
            <EmailInput
                name={'email'}
                placeholder={'enter your email'}
            />
            <PasswordInput
                name={'password'}
                placeholder={'enter your password'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'login via email'}
                    tooltip={'login via email'}
                    disabled={Boolean(!noErrors)}
                />
            </div>
        </ProcessForm.Item>
    );
}

export const authItems: ProcessItemProps<AuthProcess>[] = [
    {
        process: AuthProcess.Password,
        item: <LoginPassword />,
    },
    {
        process: AuthProcess.Unauthorized,
        item: <LoginEmailAndOauth />,
    },
    {
        process: AuthProcess.Create,
        item: <CreateAccount />,
    },
    {
        process: AuthProcess.Forgot,
        item: <ForgotPassword />,
    },
    {
        process: AuthProcess.AuthKey,
        item: <AuthKey />,
    },
    {
        process: AuthProcess.Verification,
        item: <VerificationText />,
    },
    {
        process: AuthProcess.Verified,
        item: <LoginAfterVerification />,
    },
    {
        process: AuthProcess.Success,
        item: <Success />,
    },
    {
        process: AuthProcess.RegisterAuthN,
        item: <RegisterWebAuthn />,
    },
];
