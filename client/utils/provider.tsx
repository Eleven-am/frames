import {BaseClass} from "../../server/classes/base";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import Cast from "chomecast-sender";
import {ServerResponse, useUserContext} from "./user";
import {subscribe, useDetectPageChange, useFetcher} from "./customHooks";
import {RealtimeConsumer} from "./realtime";
import {Role} from "@prisma/client";
import {useSetRecoilState} from "recoil";
import HomeLayout, {hideAtom, MetaTagAtom} from "../next/components/navbar/navigation";
import NProgress from "nprogress";
import {Conformation, Listeners} from "./notifications";
import {useManageUserInfo} from "./modify";

const BaseContext = createContext<{ base: BaseClass, cast: Cast | null, globalKey: string }>({
    base: new BaseClass(),
    cast: null,
    globalKey: ''
});

export function FramesConsumers({children}: { children: ReactNode }) {
    const base = new BaseClass();
    const setUser = useUserContext();
    const setMetaTags = useSetRecoilState(MetaTagAtom);
    const {getUserDetails} = useManageUserInfo();
    const [cast, setCast] = useState<Cast | null>(null);
    const [globalKey, setGlobalKey] = useState('');
    const setLoading = useSetRecoilState(hideAtom);
    NProgress.configure({trickleSpeed: 1200, showSpinner: false, easing: 'ease-in-out', speed: 500});
    useDetectPageChange(true, ({loading, shallow}) => {
        if (!shallow) {
            loading ? NProgress.start() : NProgress.done();
            loading && setMetaTags(null);
            setLoading(loading);
        }
    });

    const {response} = useFetcher<{ token: string, globalKey: string, user: ServerResponse }>('/midIn', {
        onSuccess: (data) => setGlobalKey(data.globalKey),
        revalidateOnFocus: false
    });

    useEffect(() => {
        const tmp = new Cast('73BFF1D2', 'urn:x-cast:com.frames.cast');
        setCast(tmp);
    }, [])

    subscribe(async (user: ServerResponse | undefined) => {
        if (user?.context) {
            if (user.context.role === Role.GUEST) {
                setUser(null);
                await fetch('/api/auth?action=logout');
                await fetch('/midOut');

            } else {
                setUser(user.context);
                const confirm = await base.makeRequest<ServerResponse>('/api/auth', {process: 'context'}, 'POST');
                if (confirm?.context) {
                    setUser(confirm.context);
                    await getUserDetails();

                } else
                    setUser(null);
            }
        } else
            setUser(null);
    }, response?.user);

    return (
        <BaseContext.Provider value={{base, cast, globalKey}}>
            <RealtimeConsumer token={response?.token || ''} endpoint={'wss://hopr.maix.ovh/socket'}>
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
    return useContext(BaseContext).globalKey;
}
