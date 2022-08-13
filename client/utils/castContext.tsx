import {useCallback} from "react";
import {atom, useRecoilState} from "recoil";
import {CastEvent, MediaObject, VideoState} from "chomecast-sender";
import {useBaseCast} from "./provider";

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

const sourceAtom = atom({
    key: 'castSourceAtom', default: ''
})

export const ChromeCastStateAtom = atom<{ available: boolean, casting: boolean }>({
    key: 'ChromeCastState', default: {
        available: false, casting: false
    }
})

export default function useCast() {
    const cast = useBaseCast();
    const [source, setSource] = useRecoilState(sourceAtom);

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
