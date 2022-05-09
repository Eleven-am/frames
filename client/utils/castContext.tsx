import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import {atom, useRecoilState, useSetRecoilState} from "recoil";
import Cast, {CastEvent, CastEventType, MediaObject, VideoState} from "chomecast-sender";
import {GroupWatchListener} from "./groupWatch";
import {useInfoDispatch} from "../next/components/misc/inform";

export interface LoadVideo {
    backdrop: string;
    logo: string | null;
    name: string;
    location: string;
}

export const CastEventAtom = atom<CastEvent | null>({
    key: 'CastEventAtom', default: null
})

export const VideoStateAtom = atom<VideoState | null>({
    key: 'VideoStateAtom', default: null
})

const CastContext = createContext<Cast | undefined>(undefined);

export function CastContextProvider({children}: { children: ReactNode }) {
    const [cast, setCast] = useState<Cast | undefined>(undefined);

    useEffect(() => {
        const tmp = new Cast('73BFF1D2', 'urn:x-cast:com.frames.cast');
        setCast(tmp);
    }, [])

    return (
        <CastContext.Provider value={cast}>
            <CastListener/>
            <GroupWatchListener/>
            {children}
        </CastContext.Provider>
    )
}

const sourceAtom = atom({
    key: 'castSourceAtom', default: ''
})

export const CastConnectionAtom = atom<{ available: boolean, connected: boolean }>({
    key: 'castConnectionAtom',
    default: {
        available: false,
        connected: false
    }
})

export function CastListener() {
    const cast = useContext(CastContext);
    const dispatch = useInfoDispatch();
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);
    const setConnected = useSetRecoilState(CastConnectionAtom);
    const eventHandler = (event: CastEvent | null) => {
        setEventState(event);
        if (event && event.state && event.state.time !== 0) setVideo(event.state);
    }

    useEffect(() => {
        cast?.on(CastEventType.AVAILABLE, event => {
            eventHandler(event);
            setConnected({available: true, connected: false})
        })

        cast?.on(CastEventType.DURATIONCHANGE, eventHandler)

        cast?.on(CastEventType.PLAYING, eventHandler)

        cast?.on(CastEventType.PAUSED, eventHandler)

        cast?.on(CastEventType.VOLUMECHANGE, eventHandler)

        cast?.on(CastEventType.CONNECT, eventHandler)

        cast?.on(CastEventType.DISCONNECT, () => eventHandler(null))

        cast?.on(CastEventType.TIMEUPDATE, eventHandler)

        cast?.on(CastEventType.ERROR, event => {
            dispatch({
                type: 'error', heading: 'Cast Error', message: event.error?.error || 'Unknown error'
            })
        })

        cast?.on(CastEventType.END, () => eventHandler(null))

        cast?.on(CastEventType.BUFFERING, eventHandler)

        cast?.on(CastEventType.MUTED, eventHandler)

        setConnected({
            available: cast?.available || false,
            connected: cast?.connected || false
        })
    }, [cast])

    return null;
}

export default function useCast() {
    const cast = useContext(CastContext);
    const [source, setSource] = useRecoilState(sourceAtom);
    const setConnected = useSetRecoilState(CastConnectionAtom);

    const sendMessage = useCallback((object: any) => {
        cast?.connected && cast.send(object);
    }, [cast?.connected]);

    const connect = useCallback(async () => {
        if (cast?.available)
            await cast.connect();
    }, [cast?.available])

    const seek = useCallback((position: number) => {
        cast && cast.connected && cast.seek(position)
    }, [cast?.connected])

    const playPause = useCallback(() => {
        cast?.connected && cast.playPause();
    }, [cast?.connected])

    const muteUnmute = useCallback(() => {
        cast?.connected && cast.muteUnmute();
    }, [cast?.connected])

    const setCastVolume = useCallback((float: number) => {
        cast?.connected && cast.volume(float);
    }, [cast?.connected])

    const disconnect = useCallback(() => {
        cast && cast.connected && cast.disconnect();
        setSource('');
        setConnected(prev => ({...prev, connected: false}))
    }, [cast?.connected])

    const castMedia = useCallback((video: MediaObject, obj: LoadVideo) => {
        if (cast?.connected && source !== obj.location) {
            cast.castMedia(video, obj);
            setSource(obj.location);
        }
    }, [cast?.connected])

    const handleCastBtnClick = useCallback(() => {
        cast?.connected ? disconnect() : connect();
    }, [cast?.connected])

    return {
        connect,
        disconnect,
        castMedia,
        sendMessage,
        playPause,
        muteUnmute,
        setCastVolume,
        seek,
        source,
        handleCastBtnClick,
        device: cast?.device || null,
        connected: cast?.connected || false,
        available: cast?.available || false
    }
}