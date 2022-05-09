import {Role} from "@prisma/client";
import {
    AuthContextErrorAtom,
    AuthContextHandler,
    AuthContextProcessAtom, Authenticated,
    AuthErrors,
    AuthKeyAtom
} from "../next/components/auth/authContext";
import {ReactNode, useEffect, useRef, useState} from "react";
import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {ManageAuthKey} from "../../server/classes/auth";
import NProgress from "nprogress";
import {RealtimeConsumer, useChannel} from "./realtime";
import {useBase} from "./Providers";

export interface ContextType {
    email: string;
    session: string;
    channel: string;
    role: Role
}

interface ServerResponse {
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

const Loading = atom<{loading: boolean, globalKey: string | null}>({
    key: 'userLoading',
    default: {
        loading: true,
        globalKey: null
    }
})

const ENDPOINT = 'https://frameshomebase.vercel.app/api/oauth?type=';
export type Provider = 'google' | 'facebook' | 'github' | 'twitter' | 'discord'

export function useAuth() {
    const {user, confirmAuthKey} = useUser();
    const [lAuth, setLAuth] = useState(false);
    const [valid, setValid] = useState(false);
    const [auth, setAuth] = useRecoilState(AuthKeyAtom);
    const {authError} = useRecoilValue(AuthErrors);
    const {error} = useRecoilValue(AuthContextHandler);
    const setError = useSetRecoilState(AuthContextErrorAtom);

    const confirmKey = async () => {
        const res = await confirmAuthKey(auth);
        if (res !== 0) {
            const error = res === -1 ? 'invalid auth key' : 'this auth key has already been used';
            setError(error);
            setLAuth(true);

        } else {
            setValid(true);
            setError(null);
            setLAuth(false);
        }
    }

    const manageAuth = async (auth: string) => {
        if (auth.length === 24)
            await confirmKey();

        else if (auth === 'homeBase') {
            if (user?.role === Role.ADMIN) {
                setError(null);
                setLAuth(false);
                setValid(true);

            } else {
                setError('invalid auth key')
                setLAuth(true);
                setValid(false);
            }
        } else {
            setError(null);
            setLAuth(false);
            setValid(false);
        }
    }

    useEffect(() => {
        manageAuth(auth);
    }, [auth])

    return {authError: authError || lAuth, auth, setAuth, valid, error}
}

const SocketUserAtom = atom<SocketUser | null>({
    key: 'socketUser',
    default: null
});

export function UserContextProvider({children}: { children: ReactNode }) {
    const base = useBase();
    const setUser = useSetRecoilState(UserContext);
    const setLoading = useSetRecoilState(Loading);
    const [apiKey, setApiKey] = useState('');

    const getUser = async () => {
        const data = await base.makeRequest<{apiKey: string, globalKey: string}>('/getApiKey', null);
        if (data) {
            setApiKey(data.apiKey);
            setLoading(prev => ({...prev, globalKey: data.globalKey}));
        }

        const res = await base.makeRequest<ServerResponse>('/midIn', {process: 'context'});
        if (res?.error) {
            setLoading(prev => ({...prev, loading: false}));
            setUser(null);
            return;

        } else if (res?.context?.role === Role.GUEST) {
            setUser(null);
            await fetch('/api/auth?action=logout');
            await fetch('midOut');
            setLoading(prev => ({...prev, loading: false}));

        } else {
            const username = res?.context?.email.split('@')[0] || '';
            setUser(res?.context ? {...res.context, username} : null);
            setLoading(prev => ({...prev, loading: false}));
        }

        const context = res?.context || {};
        const serverContext = await base.makeRequest<ServerResponse>('/api/auth', {
            ...context,
            process: 'context'
        }, 'POST');
        if (serverContext?.error) {
            setLoading(prev => ({...prev, loading: false}));
            setUser(null);
            return;
        } else {
            const username = serverContext?.context?.email.split('@')[0] || '';
            setUser(serverContext?.context ? {...serverContext.context, username} : null);
            setLoading(prev => ({...prev, loading: false}));
        }
    }

    useEffect(() => {
        getUser();
    }, []);

    return (
        <RealtimeConsumer apiKey={apiKey}>
            {children}
        </RealtimeConsumer>
    )
}

export default function useUser() {
    const base = useBase();
    const [user, setUser] = useRecoilState(UserContext);
    const win = useRef<Window | null>(null);
    const [data, setData] = useRecoilState(Loading);
    const setProcess = useSetRecoilState(AuthContextProcessAtom);
    const [socketUser, setSocketUser] = useRecoilState(SocketUserAtom);
    const channel = useChannel('auth', {username: 'auth'});
    const auth = useRecoilValue(Authenticated);

    const confirmAuthKey = async (auth: string) => {
        let info = await base.makeRequest<number>('/api/auth', {auth, process: 'confirmAuthKey'}, 'POST');
        return info !== null ? info : -1;
    }

    const signIn = async (user: string, pass: string) => {
        let data = {user: user.toLowerCase(), pass, process: 'logIn'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            const username = res.context.email.split('@')[0];
            setUser({username, ...res.context});
            return null;
        }

        return res?.error || 'something went wrong';
    }

    const signUp = async (user: string, pass: string, authKey: string) => {
        let data = {user, pass, authKey, process: 'signUp'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            const username = res.context.email.split('@')[0];
            setUser({username, ...res.context});
            return null;
        }

        return res?.error || 'something went wrong';
    }

    const signAsGuest = async () => {
        let data = {process: 'signAsGuest'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', data, 'POST');
        if (res?.context) {
            const username = res.context.email.split('@')[0];
            setUser({username, ...res.context});
            return null;
        }

        return res?.error || 'something went wrong';
    }

    const signOut = async () => {
        NProgress.start();
        setData(prev => ({...prev, loading: true}));
        setUser(null);
        await fetch('/api/auth?action=logout');
        await fetch('midOut');
        setData(prev => ({...prev, loading: false}));
    }

    const oauthAuth = async (oauthPass: number, email: string, authKey?: string) => {
        const user = {user: email, pass: `${oauthPass}`, authKey, process: 'OAUTH'};
        let res = await base.makeRequest<ServerResponse>('/api/auth', user, 'POST');
        if (res?.context) {
            const username = res.context.email.split('@')[0];
            setUser({username, ...res.context});
            setSocketUser(null);
            return null;
        }

        return res?.error || 'something went wrong';
    }

    const confirmMail = async (email: string) => {
        let data = {email: email.toLowerCase(), process: 'confirmMail'};
        let info = await base.makeRequest<boolean>('/api/auth', data, 'POST');
        return info ? "password" : "create";
    }

    const generateAuthKey = async (): Promise<{ authKey?: string, error?: string }> => {
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
    }

    const manageKeys = async () => {
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
    }

    const signOauth = async (provider: Provider) => {
        if (channel.reference?.reference && auth) {
            channel.transport?.on('whisper', (data: any) => checkOauth(data.body));
            let url = ENDPOINT + 'gen' + base.capitalize(provider) + '&state=' + channel.reference.reference;
            win.current = window.open(url, '_blank');
        }
    }

    const updateUser = async (authKey: string) => {
        if (socketUser)
            return await oauthAuth(socketUser.oauthPass, socketUser.email, authKey);

        return 'there is no user';
    }

    const checkOauth = async (user: SocketUser) => {
        if (win.current) {
            NProgress.start();
            setSocketUser(user);
            win.current?.close();
            win.current = null;
            const {oauthPass, email} = user;
            const res = await confirmMail(email);
            if (res === 'password')
                await oauthAuth(oauthPass, email);
            else if (res === 'create')
                setProcess("authKey");
        }
    }

    const forgotPassword = async (email: string) => {
        let data = {email, process: 'forgotPassword'};
        return base.makeRequest<boolean>('/api/auth', data, 'POST');
    }

    const connectSocket = () => channel.connect();

    const disconnectSocket = () => channel.disconnect();

    const modifyPlaybackInfo = async (inform: boolean, autoplay: boolean) => {
        if (user) {
            const response = await base.makeRequest<boolean>(
                '/api/auth',
                {process: 'modifyPlaybackInfo', inform, autoplay, ...user},
                'POST'
            );

            if (response)
                return {success: 'User settings updated'};

            else return {error: 'Something went wrong'};
        }
    }

    return {
        connect: connectSocket,
        signIn, signUp, loading: data.loading,
        disconnect: disconnectSocket,
        signAsGuest, signOut, signOauth,
        connected: channel.connected, user,
        confirmAuthKey, updateUser, confirmMail,
        modifyPlaybackInfo, forgotPassword,
        generateAuthKey, manageKeys,
    }
};

export const useGlobalKey = () => useRecoilValue(Loading).globalKey;
