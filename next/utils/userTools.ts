import {Role} from '@prisma/client';
import {atom, useRecoilState, useSetRecoilState} from 'recoil';
import {useLoadEffect} from "./customHooks";
import {pFetch} from "./baseFunctions";
import {AuthContextErrorAtom, AuthFade, AuthPicker} from "../states/authContext";
import {ManageAuthKey} from "../../server/classes/auth";

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

export default function useUser(frames = false, confirm = false) {
    const [loading, setLoading] = useRecoilState(Loading);
    const setError = useSetRecoilState(AuthContextErrorAtom);
    const setPicker = useSetRecoilState(AuthPicker);
    const setFade = useSetRecoilState(AuthFade);
    const [user, setUser] = useRecoilState(UserContext);

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
        let data = {user, pass, process: 'logIn'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error)
            setError(res.error);
        else if (res.context)
            setUser(res.context);
    }

    const signUp = async (user: string, pass: string, authKey: string) => {
        let data = {user, pass, authKey, process: 'create'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error)
            setError(res.error);
        else if (res.context)
            setUser(res.context);
    }

    const signAsGuest = async () => {
        setFade(true);
        const data = {process: 'guestIn'};
        let res: ServerResponse = await pFetch(data, '/api/auth');
        if (res.error)
            setUser(null);
        else if (res.context)
            setUser(res.context);
    }

    const signOut = async () => {
        setUser(null);
        await fetch('/api/auth?action=logout');
    }

    const oauthAuth = async (user_name: string, oauthPass: number, email: string, authKey?: string) => {
        const user = {user: email, pass: `${oauthPass}`, username: user_name, authKey, process: 'OAUTH'};
        let res: ServerResponse = await pFetch(user, '/api/auth');
        if (res.error)
            setError(res.error);
        else if (res.context)
            setUser(res.context);
    }

    const confirmAuth = async () => {
        let res: ServerResponse = await pFetch({process: 'confirmAuth'}, '/api/auth');
        if (res.error)
            setError(res.error);
        else if (res.context)
            setUser(res.context);

        setLoading(false);
    }

    const getFrameUser = async () => {
        let res: ServerResponse = await pFetch({process: 'framedUser'}, '/api/auth');
        if (res.error)
            setError(res.error);
        else if (res.context)
            setUser(res.context);

        setLoading(false);
    }

    const generateAuthKey = async (): Promise<{ authKey?: string, error?: string }> => {
        if (user && user.role === Role.ADMIN) {
            const response: { authKey: string } | null = await pFetch({
                ...user,
                process: 'generateAuthKey'
            }, '/api/auth');
            if (response)
                return response;
        }

        return {error: 'You do not have permission to generate keys'};
    }

    const manageKeys = async () => {
        if (user && user.role === Role.ADMIN) {
            const response: ManageAuthKey[] | null = await pFetch({...user, process: 'manageKeys'}, '/api/auth');
            if (response)
                return {response};
        }

        return {error: 'You do not have permission this action'};
    }

    useLoadEffect(() => {
        if (loading && confirm) {
            if (frames)
                getFrameUser();

            else if (!user)
                confirmAuth();

            else
                setLoading(false);
        }
        return () => frames && user?.role === Role.GUEST && signOut();
    }, [user])

    return {
        user,
        loading,
        confirmMail,
        generateAuthKey,
        signAsGuest,
        signIn,
        signUp,
        oauthAuth,
        signOut,
        confirmAuthKey,
        manageKeys
    }
}