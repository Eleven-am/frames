import {createContext, ReactNode, useCallback, useContext, useEffect, useRef} from "react";
import {atom, useRecoilState, useSetRecoilState} from "recoil";
import {CastEventAtom, LoadVideo, VideoStateAtom} from "../states/FramesStates";
import Cast, {CastEvent, CastEventType, MediaObject} from "chomecast-sender";

const CastContext = createContext<Cast | undefined>(undefined);

export function CastContextProvider({children}: { children: ReactNode }) {
    const cast = useRef<Cast>();

    useEffect(() => {
        if (typeof Window !== "undefined")
            cast.current = new Cast('73BFF1D2', 'urn:x-cast:com.frames.cast');
    }, [])

    return (
        <CastContext.Provider value={cast.current}>
            <CastListener/>
            {children}
        </CastContext.Provider>
    )
}

const sourceAtom = atom({
    key: 'castSourceAtom',
    default: ''
})

export function CastListener() {
    const cast = useContext(CastContext);
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);
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

        cast?.on(CastEventType.BUFFERING, eventHandler)

        cast?.on(CastEventType.MUTED, eventHandler)
    }, [cast])

    return null;
}

export default function useCast() {
    const cast = useContext(CastContext);
    const [source, setSource] = useRecoilState(sourceAtom);

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

    const castMedia = useCallback((video: MediaObject, obj: LoadVideo) => {
        if (cast?.connected && source !== obj.location) {
            cast.castMedia(video, obj);
            setSource(obj.location);
        }
    }, [cast?.connected])

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