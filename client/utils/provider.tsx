import {BaseClass} from "../../server/classes/base";
import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import Cast from "chomecast-sender";
import {ServerResponse, useUserContext} from "./user";
import {subscribe, useDetectPageChange, useFetcher} from "./customHooks";
import {RealtimeConsumer} from "./realtime";
import {Role} from "@prisma/client";
import {useSetRecoilState, useRecoilValue} from "recoil";
import HomeLayout, {hideAtom} from "../next/components/navbar/navigation";
import NProgress from "nprogress";
import {Conformation, globalChannelKeyAtom, Listeners} from "./notifications";

const BaseContext = createContext<{ base: BaseClass, cast: Cast | null}>({
    base: new BaseClass(),
    cast: null,
});

export function FramesConsumers({children}: { children: ReactNode }) {
    const base = new BaseClass();
    const setUser = useUserContext();
    const [usr, setUsr] = useState<ServerResponse | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [cast, setCast] = useState<Cast | null>(null);
    const setGlobalKey = useSetRecoilState(globalChannelKeyAtom);
    const setLoading = useSetRecoilState(hideAtom);
    NProgress.configure({trickleSpeed: 1200, showSpinner: false, easing: 'ease-in-out', speed: 500});
    useDetectPageChange(true, ({loading, shallow}) => {
        if (!shallow) {
            loading ? NProgress.start() : NProgress.done();
            setLoading(loading);
        }
    });

    const {response} = useFetcher<{ token: string, globalKey: string, user: ServerResponse }>('/midIn', {
        onSuccess: (data) => {
            setGlobalKey(data.globalKey);
            setToken(data.token);
        },
        revalidateOnFocus: false
    });

    useEffect(() => {
        const tmp = new Cast('73BFF1D2', 'urn:x-cast:com.frames.cast');
        setCast(tmp);
    }, [])

    const getKeys = useCallback(async () => {
        const data = await base.makeRequest<{ token: string, globalKey: string, user: ServerResponse }>('/midIn', null);
        if (data) {
            setToken(data.token);
            setGlobalKey(data.globalKey);
            setUsr(data.user);
        }
    }, [base]);

    subscribe(async (user: ServerResponse | undefined) => {
        if (user?.context) {
            if (user.context.role === Role.GUEST) {
                await setUser(null);
                await fetch('/api/auth?action=logout');
                await fetch('/midOut');

            } else {
                await setUser(user.context);
                const confirm = await base.makeRequest<ServerResponse>('/api/auth', {process: 'context'}, 'POST');
                if (confirm?.context)
                    await setUser(confirm.context);
                else
                    await setUser(null);
            }
        } else
            await setUser(null);
    }, (usr || response?.user));

    return (
        <BaseContext.Provider value={{base, cast}}>
            <RealtimeConsumer token={(token || response?.token) || ''} endpoint={'wss://hopr.maix.ovh/socket'} onError={getKeys}>
                <Listeners/>
                <HomeLayout>
                    {children}
                </HomeLayout>
                <Conformation/>
            </RealtimeConsumer>
        </BaseContext.Provider>
    )
}

export default function useBase() {
    return useContext(BaseContext).base;
}

export function useBaseCast() {
    return useContext(BaseContext).cast;
}

export function useGlobalKey() {
    return useRecoilValue(globalChannelKeyAtom);
}
