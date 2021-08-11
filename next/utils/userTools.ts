import {Role} from '@prisma/client';
import {atom, useRecoilState, useSetRecoilState} from 'recoil';
import {useIsMounted, useLoadEffect, useLocalStorage} from "./customHooks";
import {pFetch, sFetch} from "./baseFunctions";
import {AuthContextErrorAtom, AuthPicker} from "../states/authContext";

export interface ContextType {
    email: string;
    session: string;
    role: Role
}

interface ServerResponse {
    error?: string;
    context?: ContextType
}

const UserContext = atom<ContextType | null>({
    key: 'userContext',
    default: null
});

const Loading = atom({
    key: 'userLoading',
    default: true
})

export default function useUser(frames = false) {
    const [loading, setLoading] = useRecoilState(Loading);
    const setError = useSetRecoilState(AuthContextErrorAtom);
    const setPicker = useSetRecoilState(AuthPicker);
    const [user, setUser] = useRecoilState(UserContext);
    const mounted = useIsMounted();
    const [localUser, setLocalUser] = useLocalStorage<ContextType | null>('framesUser', null);

    const confirmMail = async (user: string) => {
        let info: boolean = await pFetch({process: 'confirmEmail', email: user}, '/api/auth');
        setPicker(info);
        return info ? "password" : "create";
    }

    const confirmAuthKey = async (authKey: string) => {
        let info: number = await pFetch({process: 'confirmAuthKey', authKey}, '/api/auth');
        return info;
    }

    const signIn = async (user: string, pass: string) => {
        setLoading(true);
        let data = {user, pass, process: 'logIn'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else if (res.context) {
            setUser(res.context);
            setLocalUser(res.context);
            setLoading(false);
        }
    }

    const signUp = async (user: string, pass: string, authKey: string) => {
        setLoading(true);
        let data = {user, pass, authKey, process: 'create'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else if (res.context) {
            setUser(res.context);
            setLocalUser(res.context);
            setLoading(false);
        }
    }

    const signAsGuest = async () => {
        setLoading(true);
        const data = {guest: '' + Date.now(), process: 'guestIn'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error) {
            setUser(null);
            setLocalUser(null);
            setLoading(false);

        } else if (res.context) {
            setUser(res.context);
            setLocalUser(res.context);
            setLoading(false);
        }
    }

    const signOut = async () => {
        setUser(null);
        setLocalUser(null);
        await fetch('/api/auth?action=logout');
        setLoading(false);
    }

    const oauthAuth = async (user_name: string, oauthPass: number, email: string, authKey?: string) => {
        setLoading(true);
        const user = {user: email, pass: `${oauthPass}`, username: user_name, authKey, process: 'OAUTH'};
        let res: ServerResponse = await pFetch(user, '/api/auth');
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else if (res.context) {
            setUser(res.context);
            setLocalUser(res.context);
            setLoading(false);
        }
    }

    const confirmAuth = async (user: ContextType) => {
        setLoading(true);
        const data = {...user, process: 'confirmAuth'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error) {
            setUser(null);
            setLocalUser(null);
            setLoading(false);

        } else if (res.context) {
            setUser(res.context);
            setLocalUser(res.context);
            setLoading(false);
        }
    }

    const getFrameUser = async () => {
        setLoading(true);
        let res = await sFetch<ServerResponse>('/api/auth?action=framedUser');
        if (res && res.context) {
            setUser(res.context);
            setLocalUser(null);
            setLoading(false);

        } else {
            setUser(null);
            setLocalUser(null);
            setLoading(false);
        }
    }

    const generateAuthKey = async () => {
        if (user && user.role === Role.ADMIN) {
            const response: string | null = await pFetch({...user, process: 'generateAuthKey'}, '/api/auth');
            if (response)
                return {authKey: response};
        }

        return {error: 'You do not have permission to generate keys'};
    }

    useLoadEffect(() => {
        if (frames)
            getFrameUser();

        else if (!user && localUser && mounted())
            confirmAuth(localUser);

        else
            setLoading(false);

        return () => frames && signOut();
    }, [])

    return {user, loading, confirmMail, generateAuthKey, signAsGuest, signIn, signUp, oauthAuth, signOut, confirmAuthKey}
}