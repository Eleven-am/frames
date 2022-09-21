import {Role} from "@prisma/client";
import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {useCallback, useState} from "react";
import useBase from "./provider";
import NProgress from "nprogress";
import {useBasics, useWindowListener} from "./customHooks";
import {AuthContextProcessAtom} from "../next/components/auth/authContext";
import {ManageAuthKey} from "../../server/classes/auth";
import {useManageUserInfo} from "./modify";
import {NotificationInterface} from "../../server/classes/user";

const SocketUserAtom = atom<SocketUser | null>({
    key: 'socketUser',
    default: null
});

export interface ContextType {
    email: string;
    session: string;
    channel: string;
    identifier: string;
    role: Role
}

export type FramesContext = ContextType & {
    username: string;
} | null;

export interface ServerResponse {
    error?: string;
    context?: ContextType
}

interface SocketUser {
    oauthPass: number;
    photo: string;
    user_name: string;
    email: string;
    state: string;
}

const UserContext = atom<(ContextType & { username: string }) | null>({
    key: 'userContext',
    default: null
});

const confirmResetUser = atom<ContextType | null>({
    key: 'confirmResetUser',
    default: null
});

const Loading = atom<boolean>({
    key: 'userLoading',
    default: true
})

const ENDPOINT = 'https://frameshomebase.maix.ovh/api/oauth?type=';
export type Provider = 'google' | 'facebook' | 'spotify';

export default function useUser() {
    const base = useBase();
    const {getBaseUrl, openPopup, windowOpen, window} = useBasics();
    const setProcess = useSetRecoilState(AuthContextProcessAtom);
    const [loading, setLoading] = useRecoilState(Loading);
    const user = useRecoilValue(UserContext);
    const [resetUser, setResetUser] = useRecoilState(confirmResetUser);
    const [socketUser, setSocketUser] = useRecoilState(SocketUserAtom);
    const [state, setState] = useState('');
    const [processing, setProcessing] = useState(false);
    const setUser = useUserContext();

    const confirmAuthKey = useCallback(async (auth: string) => {
        let info = await base.makeRequest<number>('/api/auth', {auth, process: 'confirmAuthKey'}, 'POST');
        return info !== null ? info : -1;
    }, [base]);

    const signIn = useCallback(async (user: string, pass: string) => {
        let data = {user: user.toLowerCase(), pass, process: 'logIn', baseUrl: getBaseUrl()};
        let res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            await setUser(res.context);
            return null;
        }

        return res?.error || 'something went wrong';
    }, [base, setUser, getBaseUrl]);

    const signUp = useCallback(async (user: string, pass: string, authKey: string) => {
        let data = {user, pass, authKey, process: 'signUp', baseUrl: getBaseUrl()};
        let res = await base.makeRequest<{ error?: string, success?: string }>('/api/auth', data, 'POST');
        if (res?.success) {
            setProcess('verify');
            return null;
        }

        return res?.error || 'something went wrong';
    }, [base, getBaseUrl]);

    const signAsGuest = useCallback(async () => {
        let data = {process: 'signAsGuest'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            await setUser(res.context);
            return null;
        }

        return res?.error || 'something went wrong';
    }, [base, setUser]);

    const signOut = useCallback(async () => {
        NProgress.start();
        setLoading(true);
        await setUser(null);
        await fetch('/api/auth?action=logout');
        await fetch('/midOut');
        setLoading(false);
    }, [setUser]);

    const signOauth = useCallback(async (provider: Provider) => {
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        let address = ENDPOINT + 'gen' + base.capitalize(provider) + '&state=' + state;
        const title = 'Connect to ' + base.capitalize(provider);
        openPopup(address, title, 500, 650);
        setState(state);
    }, [base, openPopup]);

    const forgotPassword = useCallback(async (email: string) => {
        let data = {email, process: 'forgotPassword', baseUrl: getBaseUrl()};
        return base.makeRequest<boolean | { error: string }>('/api/auth', data, 'POST');
    }, [base, getBaseUrl]);

    const getResetPassword = useCallback(async (token: string): Promise<{ process: 'resetPassword' } | { error: string }> => {
        let data = {token, process: 'getResetPassword'};
        const user = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (user?.context) {
            setResetUser(user.context);
            return {process: 'resetPassword'};
        }

        return {error: user?.error || 'something went wrong'};
    }, [base]);

    const modifyPassword = useCallback(async (password: string) => {
        if ((resetUser && resetUser.email) || (user && user.email)) {
            const email = resetUser?.email || user?.email;
            let data = {password, email, process: 'modifyPassword', baseUrl: getBaseUrl()};
            const res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
            if (res?.context) {
                setResetUser(null);
                await setUser(res.context);
                return null;
            }

            return res?.error || 'something went wrong';
        }

        return 'something went terribly wrong';
    }, [base, getBaseUrl, resetUser, user]);

    const confirmEmail = useCallback(async (token: string) => {
        let data = {token, process: 'verifyEmail'};
        const res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            await setUser(res.context);
            return null;
        }

        return res?.error || 'something went wrong';
    }, [base]);

    const oauthAuth = useCallback(async (oauthPass: number, email: string, authKey?: string) => {
        const user = {user: email, pass: `${oauthPass}`, authKey, process: 'OAUTH'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', user, 'POST');
        if (res?.context) {
            await setUser(res.context);
            setSocketUser(null);
            return null;
        }

        return res?.error || 'something went wrong';
    }, [base]);

    const confirmMail = useCallback(async (email: string) => {
        let data = {email: email.toLowerCase(), process: 'confirmMail'};
        let info = await base.makeRequest<boolean>('/api/auth', data, 'POST');
        return info ? "password" : "create";
    }, [base]);

    const updateUser = useCallback(async (authKey: string) => {
        if (socketUser)
            return await oauthAuth(socketUser.oauthPass, socketUser.email, authKey);

        return 'there is no user';
    }, [base, socketUser, oauthAuth]);

    const generateAuthKey = useCallback(async (): Promise<{ authKey?: string, error?: string }> => {
        if (user && user.role === Role.ADMIN) {
            const response = await base.makeRequest<{ authKey?: string, error?: string }>(
                '/api/auth',
                {process: 'generateAuthKey', ...user},
                'POST'
            );

            if (response)
                return response;
        }

        return {error: 'You do not have permission to generate keys'};
    }, [base, user]);

    const manageKeys = useCallback(async () => {
        if (user && user.role === Role.ADMIN) {
            const response = await base.makeRequest<ManageAuthKey[]>(
                '/api/auth',
                {process: 'manageKeys', ...user},
                'POST'
            );

            if (response)
                return {response};
        }

        return {error: 'You do not have permission to perform this action'};
    }, [base, user]);

    const getNotifications = useCallback(async () => {
        if (user) {
            const response = await base.makeRequest<Omit<NotificationInterface, 'message' | 'data' | 'type'>[]>(
                '/api/auth',
                {process: 'getNotifications', ...user},
                'POST'
            );

            if (response)
                return response;
        }

        return [];
    }, [base, user]);

    const checkOauth = useCallback(async (user: SocketUser) => {
        if (window) {
            NProgress.start();
            setSocketUser(user);
            setProcessing(true);
            const {oauthPass, email} = user;
            const res = await confirmMail(email);
            if (res === 'password')
                await oauthAuth(oauthPass, email);

            else if (res === 'create')
                setProcess('authKey');
        }
    }, [base, confirmMail, oauthAuth, window]);

    useWindowListener('message', async (event: MessageEvent) => {
        if (event.origin === 'https://frameshomebase.maix.ovh' && event.data?.state === state) {
            const data = event.data as SocketUser;
            await checkOauth(data);
        }
    });

    return {
        getResetPassword, modifyPassword, forgotPassword,
        signAsGuest, signOut, loading, signOauth, confirmEmail, signIn,
        signUp, confirmAuthKey, updateUser, confirmMail, generateAuthKey,
        manageKeys, user, windowOpen: windowOpen || processing, getNotifications
    }
}

export const useUserContext = () => {
    const setLoading = useSetRecoilState(Loading);
    const setUser = useSetRecoilState(UserContext);
    const {getUserDetails} = useManageUserInfo();

    return async (value: ContextType | null) => {
        if (value) {
            const username = value.email.split('@')[0];
            setUser({...value, username});

        } else
            setUser(null);

        setLoading(false);
        await getUserDetails();
    }
}
