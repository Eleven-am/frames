import {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState} from "react";
import {atom, useRecoilState, useSetRecoilState} from "recoil";
import {CastEventAtom, LoadVideo, VideoStateAtom} from "../states/FramesStates";
import Cast, {CastEvent, CastEventType} from "chomecast-sender";

const CastContext = createContext<Cast | null>(null)

export function CastContextProvider({children}: { children: ReactNode }) {
    const [cast, setCast] = useState<Cast | null>(null);

    useEffect(() => {
        if (typeof Window !== "undefined" && cast === null)
            setCast(new Cast('73BFF1D2', 'urn:x-cast:com.frames.cast'));
    }, [cast])

    return (
        <CastContext.Provider value={cast}>
            {children}
        </CastContext.Provider>
    )
}

const sourceAtom = atom({
    key: 'castSourceAtom',
    default: ''
})

export default function useCast() {
    const cast = useContext(CastContext);
    const [source, setSource] = useRecoilState(sourceAtom);
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);

    const sendMessage = useCallback((object: any) => {
        cast?.connected && cast.send(object);
    }, [cast?.connected]);

    const connect = useCallback(() => {
        cast?.available && cast.connect();
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
    }, [cast?.connected])

    const castMedia = useCallback((video: HTMLVideoElement, obj: LoadVideo) => {
        if (cast?.connected && source !== obj.location) {
            cast.castMedia(video, obj);
            setSource(obj.location);
        }
    }, [cast?.connected])

    const eventHandler = (event: CastEvent | null) => {
        setEventState(event);
        if (event && event.state && event.state.time !== 0)
            setVideo(event.state);
    }

    useEffect(() => {
        cast?.on(CastEventType.AVAILABLE, eventHandler)

        cast?.on(CastEventType.DURATIONCHANGE, eventHandler)

        cast?.on(CastEventType.PLAYING, eventHandler)

        cast?.on(CastEventType.PAUSED, eventHandler)

        cast?.on(CastEventType.VOLUMECHANGE, eventHandler)

        cast?.on(CastEventType.CONNECT, eventHandler)

        cast?.on(CastEventType.DISCONNECT, () => eventHandler(null))

        cast?.on(CastEventType.TIMEUPDATE, eventHandler)

        cast?.on(CastEventType.ERROR, event => {
            console.warn(event.error)
        })

        cast?.on(CastEventType.END, () => eventHandler(null))

        cast?.on(CastEventType.NAMESPACE, event => {
            const data: { current: number | null, duration: number | null } = JSON.parse(event.namespaceResponse!);
            eventHandler({
                ...event,
                state: {
                    ...event.state,
                    time: data.current || event.state.time,
                    duration: data.duration || event.state.duration
                }
            });
        })

        cast?.on(CastEventType.BUFFERING, eventHandler)

        cast?.on(CastEventType.MUTED, eventHandler)
    }, [cast])

    return {
        connect,
        disconnect,
        castMedia,
        sendMessage,
        playPause,
        muteUnmute,
        setCastVolume,
        seek, source,
        device: cast?.device || null,
        connected: cast?.connected || false,
        available: cast?.available || false
    }
}