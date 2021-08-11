import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from 'recoil';
import {Subtitles, UpNextHolder} from "../../server/classes/playback";
import {CastEvent, VideoState} from "chomecast-sender";
import useCast from "../utils/castContext";
import {useCallback, useEffect, useState} from "react";
import useUser from "../utils/userTools";
import {pFetch} from "../utils/baseFunctions";
import {SpringPlay} from "../../server/classes/springboard";
import {useIsMounted} from "../utils/customHooks";

export interface FramesSubs {
    language: string;
    data: Subtitles
}

export interface LoadVideo {
    backdrop: string;
    logo: string;
    name: string;
    location: string;
}

export const currentDuration = atom<{ current: number, duration: number, buffered: TimeRanges | null }>({
    key: 'currentDuration',
    default: {current: 0, duration: 0, buffered: null}
});

export const differance = atom<string | null>({
    key: 'differanceAtom',
    default: null
});

export const nextHolder = atom<UpNextHolder | null>({
    key: 'nextHolder',
    default: null
});

export const nextOver = atom({
    key: 'nextOver',
    default: false
});

export const shareOver = atom({
    key: 'shareOver',
    default: false
});

export const UpNextURL = atom({
    key: 'UpNextURLAtom',
    default: ''
});

export const activeSubs = atom({
    key: 'activeSubs',
    default: 'none'
});

export const mutedAtom = atom<boolean>({
    key: 'mutedAtom',
    default: false
});

export const volumeAtom = atom<number>({
    key: 'volumeAtom',
    default: 1
});

export const volumeWidth = selector<string>({
    key: 'volumeWidth',
    get: ({get}) => {
        const event = get(CastEventAtom);
        const frame = get(volumeAtom);

        const vol = event?.volume || frame;
        return (vol * 100) + '%';
    }
});

export const bufferingAtom = atom({
    key: 'bufferingAtom',
    default: true
});

export const bufferingSelector = selector({
    key: 'bufferingSelector',
    get: ({get}) => {
        const event = get(CastEventAtom);
        const frames = get(bufferingAtom);

        if (event && event.connected)
            return event.buffering;

        else return frames;
    }
});

export const mutedSelector = selector({
    key: 'mutedSelector',
    get: ({get}) => {
        const event = get(CastEventAtom);
        const frames = get(mutedAtom);

        if (event && event.connected)
            return event.muted;

        else return frames;
    }
});

export const playVideoAtom = atom<boolean | null>({
    key: 'playVideoAtom',
    default: null
});

export const playingSelector = selector({
    key: 'playingSelector',
    get: ({get}) => {
        const event = get(CastEventAtom);
        const frames = get(playVideoAtom);

        if (event && event.connected)
            return !event.paused;

        else return frames;
    }
});

export const displayInfoAtom = atom({
    key: 'displayInfoAtom',
    default: false
});

export const timeStampsAtom = selector({
    key: 'timeStampsAtom',
    get: ({get}) => {
        const event = get(VideoStateAtom);
        const frame = get(currentDuration);

        const current = event?.time || frame.current;
        const duration = event?.duration || frame.duration;

        const durationDate = new Date(0);
        durationDate.setSeconds(current);
        let valid = (new Date(durationDate)).getTime() > 0;
        const timeViewed = !valid ? '00:00' : (current >= 3600) ? durationDate.toISOString().substr(12, 7) : durationDate.toISOString().substr(14, 5);

        const totalSecondsRemaining = duration - current;
        const time = new Date(0);
        time.setSeconds(totalSecondsRemaining);
        valid = (new Date(time)).getTime() > 0;
        const timeRemaining = !valid ? '00:00' : totalSecondsRemaining >= 3600 ? time.toISOString().substr(12, 7) : time.toISOString().substr(14, 5);
        return {timeViewed, timeRemaining};
    }
});

export const playWidthAtom = selector({
    key: 'playWidthAtom',
    get: ({get}) => {
        const event = get(VideoStateAtom);
        const frame = get(currentDuration);

        const current = event?.time || frame.current;
        const duration = event?.duration || frame.duration;

        return ((current / duration) * 100) + '%';
    }
});

const FramesInformAtom = selector({
    key: 'FramesInformAtom',
    get: ({get}) => {
        const event = get(VideoStateAtom);
        const frame = get(currentDuration);

        const current = event?.time || frame.current;
        const duration = event?.duration || frame.duration;

        return {current, duration};
    }
});

export const bufferedAtom = selector({
    key: 'bufferedAtom',
    get: ({get}) => {
        const {current, buffered, duration} = get(currentDuration);
        let buffer: number | string | null = null;
        if (buffered)
            for (let i = 0; i < buffered.length; i++) {
                const startX = buffered.start(i);
                const endX = buffered.end(i);
                if (startX < current && current < endX) {
                    buffer = endX;
                    break;
                }
            }

        const temp = buffer || current;
        return ((temp / duration) * 100) + '%';
    }
});

export const displaySidesAtom = atom<boolean>({
    key: 'displaySidesAtom',
    default: true
});

export const subOverAtom = atom({
    key: 'subOverAtom',
    default: false
});

export const framesSubtitles = atom<FramesSubs[]>({
    key: 'framesSubtitles',
    default: []
});

export const moveSubsAtom = atom({
    key: 'moveSubsAtom',
    default: false
})

export const framesPlayer = atom<HTMLVideoElement | null>({
    key: 'framesPlayer',
    default: null
})

export const CastEventAtom = atom<CastEvent | null>({
    key: 'CastEventAtom',
    default: null
})

export const VideoStateAtom = atom<VideoState | null>({
    key: 'VideoStateAtom',
    default: null
})

export const SubtitlesAtom = selector({
    key: 'SubtitlesAtom',
    get: ({get}) => {
        const activeSub = get(activeSubs);
        const playing = get(playVideoAtom);
        const move = get(moveSubsAtom);
        const timeUpdate = get(currentDuration);
        const subtitles = get(framesSubtitles);

        if (timeUpdate.current > 0 && subtitles.length) {
            const current = (timeUpdate.current * 1000) - 50;
            const sub = subtitles.find(e => e.language === activeSub);
            if (sub) {
                const display = sub.data.find(e => e.start <= current && current <= e.end);
                if (display && playing)
                    return {move, display: display.text}
            }
        }

        return null;
    }
});

export default function usePlayback() {
    const {connected, playPause: playPauseCast, seek: seekCast, muteUnmute, setCastVolume} = useCast();
    const [state, setState] = useRecoilState(VideoStateAtom)
    const videoState = useRecoilValue(CastEventAtom);
    const frames = useRecoilValue(framesPlayer);

    useEffect(() => {
        if (frames) {
            if (connected) {
                frames.muted = true;
                frames.pause();

            } else {
                frames.muted = false;
                frames.currentTime = state?.time || frames.currentTime;
                frames.play();

                setState(null);
            }
        }
    }, [connected, frames])

    const playPause = useCallback(async () => {
        const video = (document.getElementById('frames-player') as HTMLVideoElement | null);
        if (video && !connected) {
            if (video.paused)
                await video.play();

            else
                video.pause();
        } else if (connected)
            playPauseCast()
    }, [connected])

    const seekVideo = useCallback((current: number, add = true) => {
        if (frames) {
            if (!connected) {
                frames.currentTime = add ? frames.currentTime + current : frames.duration * current;

            } else {
                const pos = add ? (state?.time || 0) + current : frames.duration * current;
                seekCast(pos);
            }
        }
    }, [frames, connected, state])

    const setVolume = useCallback((current: number, add = true) => {
        if (frames) {
            if (!connected) {
                frames.muted = false;
                frames.volume = add ? frames.volume + current > 1 ? 1 : frames.volume + current < 0 ? 0 : frames.volume + current : current;

            } else {
                const pos = add ? (videoState?.volume || 0) + current : current;
                setCastVolume(pos);
            }
        }
    }, [frames, connected])

    const muteUnmuteVideo = useCallback(() => {
        if (frames) {
            if (connected)
                muteUnmute();
            else
                frames.muted = !frames.muted;
        }
    }, [frames, connected])

    return {frames, playPause, seekVideo, muteUnmuteVideo, setVolume}
}

export function InformAndAuth({response}: { response: SpringPlay }) {
    const [pos, setPos] = useState(0);
    const {current, duration} = useRecoilValue(FramesInformAtom);
    const {disconnect} = useCast();
    const [diff, setDiff] = useRecoilState(differance);
    const isMounted = useIsMounted();
    const {signOut} = useUser();

    const inform = useCallback(async (current: number, duration: number) => {
        if (response.guest && current > 299 && !response.frame) {
            await signOut();
            disconnect();
        }

        if (response.inform) {
            setPos(current);
            const position = (current / duration) * 1000;
            await pFetch({auth: response.location, position}, '/api/stream/inform');
        }
    }, [response])

    useEffect(() => {
        if (response.inform && (pos + 60 < current || current < pos || current === 300) && isMounted())
            inform(current, duration)

        if (duration - current < 60 && duration - current !== 0 && isMounted())
            setDiff(Math.ceil(duration - current) + 's');

        else if (diff && isMounted())
            setDiff(null);

    }, [current, response, duration])

    return null;
}

export const resetFrames = () => {
    const aSubs = useResetRecoilState(moveSubsAtom);
    const bSubs = useResetRecoilState(framesSubtitles);
    const cSubs = useResetRecoilState(subOverAtom);
    const dSubs = useResetRecoilState(displaySidesAtom);
    const eSubs = useResetRecoilState(displayInfoAtom);
    const fSubs = useResetRecoilState(playVideoAtom);
    const gSubs = useResetRecoilState(framesPlayer);
    const hSubs = useResetRecoilState(bufferingAtom);
    const iSubs = useResetRecoilState(volumeAtom);
    const jSubs = useResetRecoilState(mutedAtom);
    const kSubs = useResetRecoilState(activeSubs);
    const lSubs = useResetRecoilState(UpNextURL);
    const mSubs = useResetRecoilState(nextOver);
    const nSubs = useResetRecoilState(nextHolder);
    const oSubs = useResetRecoilState(currentDuration);
    const pOver = useResetRecoilState(shareOver);
    const qOver = useResetRecoilState(CastEventAtom);
    const rOver = useResetRecoilState(VideoStateAtom);
    const sOver = useResetRecoilState(differance);

    return () => {
        aSubs();
        bSubs();
        cSubs();
        dSubs();
        eSubs();
        fSubs();
        gSubs();
        hSubs();
        iSubs();
        jSubs();
        kSubs();
        lSubs();
        pOver();
        mSubs();
        nSubs();
        oSubs();
        qOver();
        rOver();
        sOver();
    }
}