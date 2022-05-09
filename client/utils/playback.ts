import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import useCast, {CastConnectionAtom, CastEventAtom, VideoStateAtom} from "./castContext";
import {GroupWatchSide, Message, useGroupWatch} from "./groupWatch";
import {SyntheticEvent, useCallback, useEffect, useRef, useState} from "react";
import {SpringPlay} from "../../server/classes/listEditors";
import useUser from "./userTools";
import {useBasics, useEventListener} from "./customHooks";
import {UpNext} from "../../server/classes/media";
import {useRouter} from "next/router";
import {Sub} from "../../server/classes/playBack";
import {useInfoDispatch} from "../next/components/misc/inform";
import {AlreadyStreamingAtom, useNotification} from "./notificationConext";
import {useBase} from "./Providers";
import {Role} from "@prisma/client";

export interface FramesSubs {
    language: string;
    data: Sub[];
}

export const framesVideoStateAtom = atom<SpringPlay | null>({
    key: 'framesVideoState', default: null,
});

export const currentDuration = atom<{ current: number, duration: number, buffered: TimeRanges | null }>({
    key: 'currentDuration', default: {current: 0, duration: 0, buffered: null}
});

export const framesPlayer = atom<HTMLVideoElement | null>({
    key: 'framesPlayer', default: null
});

export const FramesInformAtom = selector({
    key: 'FramesInformAtom', get: ({get}) => {
        const event = get(VideoStateAtom);
        const frame = get(currentDuration);

        const current = event?.time || frame.current;
        const duration = event?.duration || frame.duration;

        return {current, duration, buffered: frame.buffered};
    }
});

export const PlaybackDisplayInformation = selector({
    key: 'PlaybackDisplayInformation', get: ({get}) => {
        const {current, duration, buffered} = get(FramesInformAtom);
        let buffer: number | string | null = null;
        if (buffered) for (let i = 0; i < buffered.length; i++) {
            const startX = buffered.start(i);
            const endX = buffered.end(i);
            if (startX < current && current < endX) {
                buffer = endX;
                break;
            }
        }

        const temp = buffer || current;
        const bufferedWidth = ((temp / duration) * 100) + '%';
        const currentWidth = ((current / duration) * 100) + '%';

        const durationDate = new Date(0);
        durationDate.setSeconds(current);
        let valid = (new Date(durationDate)).getTime() > 0;
        const timeViewed = !valid ? '00:00' : (current >= 3600) ? durationDate.toISOString().substr(12, 7) : durationDate.toISOString().substr(14, 5);

        const totalSecondsRemaining = duration - current;
        const time = new Date(0);
        time.setSeconds(totalSecondsRemaining);
        valid = (new Date(time)).getTime() > 0;
        const timeRemaining = !valid ? '00:00' : totalSecondsRemaining >= 3600 ? time.toISOString().substr(12, 7) : time.toISOString().substr(14, 5);

        return {bufferedWidth, currentWidth, timeViewed, timeRemaining};
    }
});

type PLAYER_TYPE = 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'ENDED' | 'NOT_BEGUN' | 'FAILED_TO_START';

export const framesPlayerStateAtom = atom<PLAYER_TYPE>({
    key: 'framesPlayerState', default: 'NOT_BEGUN'
});

export const framesPlayerStateSelector = selector({
    key: 'framesPlayerStateSelector', get: ({get}) => {
        const state = get(CastEventAtom);
        if (state) return state.buffering ? 'BUFFERING' : state.paused ? 'PAUSED' : 'PLAYING';

        return get(framesPlayerStateAtom);
    }
});

export const volumeFrameAtom = atom<{ volume: number, mute: boolean }>({
    key: 'volumeFrame', default: {
        volume: 1, mute: false
    }
})

export const VolumeSelector = selector({
    key: 'VolumeSelector', get: ({get}) => {
        const {volume, mute} = get(volumeFrameAtom);
        const state = get(CastEventAtom);

        if (state) return {volume: state.volume, mute: state.muted};

        else return {volume, mute};
    }
});

export const displaySidesAtom = atom<{ left: boolean, right: boolean, info: boolean, controls: boolean }>({
    key: 'displaySides', default: {
        left: true, info: false, right: true, controls: true
    }
})

export const shareAndDownloadAtom = atom<{ share: boolean, download: boolean }>({
    key: 'shareAndDownload', default: {
        share: false, download: false,
    }
})

export const PipAndFullscreenAtom = atom<{ pip: boolean, fullscreen: boolean, difference: boolean }>({
    key: 'PipAndFullscreen', default: {
        pip: false, fullscreen: false, difference: false
    }
})

export const SubtitlesAndUpNextAtom = atom<{ subtitles: boolean, upNext: boolean, settings: boolean }>({
    key: 'SubtitlesAndUpNext', default: {
        settings: false, subtitles: false, upNext: false
    }
})

export const UpNextAtom = atom<UpNext | null>({
    key: 'UpNext', default: null
})

export const HideImageAtom = atom<boolean>({
    key: 'HideImage', default: false
})

export const framesSubtitlesAtom = atom<{ subtitles: FramesSubs[], activeSub: string }>({
    key: 'framesSubtitles', default: {
        subtitles: [], activeSub: 'none',
    }
})

export const SubtitlesSyncAtom = atom<{ language: string, sync: number }[]>({
    key: 'SubtitlesSync', default: []
})

export const SubtitlesAtom = selector({
    key: 'SubtitlesAtom', get: ({get}) => {
        let {current} = get(FramesInformAtom);
        const playing = get(framesPlayerStateAtom) === 'PLAYING';
        const subSync = get(SubtitlesSyncAtom);
        const {subtitles, activeSub} = get(framesSubtitlesAtom);
        const moveSub = get(displaySidesAtom).controls;

        if (current > 0 && subtitles.length) {
            const sub = subtitles.find(e => e.language === activeSub);
            const sync = subSync.find(e => e.language === activeSub);
            current = (current * 1000) + (sync?.sync || 0);
            if (sub) {
                const display = sub.data.find(e => e.start <= current && current <= e.end);
                if (display && playing) return {move: moveSub, display: display.text, style: display.style};
            }
        }

        return null;
    }
});

export const differance = selector<string | null>({
    key: 'differenceSelector', get: ({get}) => {
        const {current, duration} = get(FramesInformAtom);
        const autoplay = get(framesVideoStateAtom)?.autoPlay || false;
        const {difference} = get(PipAndFullscreenAtom);

        if ((autoplay && (duration > current) && (duration - current < 60)) || difference) return Math.ceil(duration - current) + 's';

        return null;
    }
});

export const FramesPlayerErrorAtom = atom<string | null>({
    key: 'FramesPlayerError', default: null
});

const AirplayAtom = atom<{ available: boolean, casting: boolean }>({
    key: 'Airplay', default: {
        available: false, casting: false
    }
})

export const AirplaySelector = selector<{ available: boolean, casting: boolean, protocol: 'cast' | 'airplay' }>({
    key: 'AirplaySelector', get: ({get}) => {
        const airplay = get(AirplayAtom);
        const state = get(CastConnectionAtom);
        const castVideoState = get(CastEventAtom);

        return {
            available: airplay.available || state.available,
            casting: airplay.casting || castVideoState?.connected || state.connected,
            protocol: airplay.available ? 'airplay' : 'cast'
        }
    }
});

export const fullscreenAddressAtom = atom<{ fullscreen: string | null, startTime: number }>({
    key: 'fullscreenAddress', default: {
        fullscreen: null, startTime: 0
    }
})

function playing(video: HTMLVideoElement) {
    return (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 3);
}

export const cleanUp = () => {
    const {user, signOut} = useUser();
    const response = useRecoilValue(framesVideoStateAtom);
    const fullscreenReset = useResetRecoilState(fullscreenAddressAtom);
    const framesVideoStateReset = useResetRecoilState(framesVideoStateAtom);
    const currentReset = useResetRecoilState(currentDuration);
    const framesReset = useResetRecoilState(framesPlayer);
    const framesPlayerStateReset = useResetRecoilState(framesPlayerStateAtom);
    const volumeFrameReset = useResetRecoilState(volumeFrameAtom);
    const displayReset = useResetRecoilState(displaySidesAtom);
    const shareAndDownloadReset = useResetRecoilState(shareAndDownloadAtom);
    const PipAndFullscreenReset = useResetRecoilState(PipAndFullscreenAtom);
    const SubtitlesAndUpNextReset = useResetRecoilState(SubtitlesAndUpNextAtom);
    const UpNextReset = useResetRecoilState(UpNextAtom);
    const HideImageReset = useResetRecoilState(HideImageAtom);
    const framesSubtitlesReset = useResetRecoilState(framesSubtitlesAtom);
    const SubtitlesSyncReset = useResetRecoilState(SubtitlesSyncAtom);
    const FramesPlayerErrorReset = useResetRecoilState(FramesPlayerErrorAtom);
    const CastEventReset = useResetRecoilState(CastEventAtom);
    const CastStateReset = useResetRecoilState(VideoStateAtom);
    const AirplayReset = useResetRecoilState(AirplayAtom);
    const alreadyStreamingReset = useResetRecoilState(AlreadyStreamingAtom);
    const {channel} = useGroupWatch();
    const {globalChannel} = useNotification();

    return  () => {
        channel.modifyPresenceState('online');
        globalChannel.modifyPresenceState('online');
        fetch('/api/stream/verifyStream?action=done');
        if (user?.role === Role.GUEST && response?.frame)
            signOut();

        fullscreenReset();
        framesVideoStateReset();
        currentReset();
        framesReset();
        framesPlayerStateReset();
        volumeFrameReset();
        displayReset();
        shareAndDownloadReset();
        PipAndFullscreenReset();
        SubtitlesAndUpNextReset();
        UpNextReset();
        HideImageReset();
        framesSubtitlesReset();
        SubtitlesSyncReset();
        FramesPlayerErrorReset();
        CastEventReset();
        CastStateReset();
        AirplayReset();
        alreadyStreamingReset();
    }
}

export default function usePlayback(inform = true) {
    const cast = useCast();
    const base = useBase();
    const router = useRouter();
    const {signOut} = useUser();
    const {isMounted} = useBasics();
    const dispatch = useInfoDispatch();
    const player = useRecoilValue(framesPlayer);
    const [pos, setPos] = useState(0);
    const setVolumeState = useSetRecoilState(volumeFrameAtom);
    const response = useRecoilValue(framesVideoStateAtom);
    const castState = useRecoilValue(AirplaySelector);
    const setSides = useSetRecoilState(displaySidesAtom);
    const [upNext, setUpNext] = useRecoilState(UpNextAtom);
    const [fsADDR, setFsADDR] = useRecoilState(fullscreenAddressAtom);
    const shareAndDownload = useSetRecoilState(shareAndDownloadAtom);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const chromecastEvent = useRecoilValue(CastEventAtom);
    const chromecastState = useRecoilValue(VideoStateAtom);
    const setSubtitles = useSetRecoilState(framesSubtitlesAtom);
    const setSubSync = useSetRecoilState(SubtitlesSyncAtom);
    const setCurrent = useSetRecoilState(currentDuration);
    const setHideImage = useSetRecoilState(HideImageAtom);
    const setError = useSetRecoilState(FramesPlayerErrorAtom);
    const setPState = useSetRecoilState(framesPlayerStateAtom);
    const twoSecs = useRef<NodeJS.Timeout | null>(null);
    const fiveSecs = useRef<NodeJS.Timeout | null>(null);
    const tenSecs = useRef<NodeJS.Timeout | null>(null);
    const playerState = useRef<PLAYER_TYPE>('NOT_BEGUN');
    const {globalChannel} = useNotification();
    const {sendMessage: send, pushNext, lobbyOpen, channel} = useGroupWatch();

    const setPlayerState = useCallback((state: PLAYER_TYPE | ((p: PLAYER_TYPE) => PLAYER_TYPE)) => {
            const val = typeof state === 'function' ? state(playerState.current) : state;
            setPState(val);
            playerState.current = val;
        }, [setPState]);

    const sendMessage = useCallback((message: Message) => {
        if (inform) send(message);
    }, [send]);

    const castToDevice = useCallback(async () => {
        if (castState.available) {
            if (castState.protocol === 'airplay') {
                const player = document.getElementById(response?.playerId || '') as HTMLVideoElement;
                if (player && player.webkitShowPlaybackTargetPicker) await player.webkitShowPlaybackTargetPicker();

            } else if (castState.protocol === 'cast') await cast.handleCastBtnClick();
        }
    }, [response, castState, cast.handleCastBtnClick]);

    const showControls = useCallback(() => {
        fiveSecs.current && clearTimeout(fiveSecs.current);
        tenSecs.current && clearTimeout(tenSecs.current);
        setSides(prev => ({...prev, info: false, controls: true}));

        fiveSecs.current = setTimeout(() => {
            setSides(prev => ({...prev, info: false, controls: false}));
            setSubtitlesAndUpNext({settings: false, subtitles: false, upNext: false});
            shareAndDownload({share: false, download: false});
        }, 5000);
        tenSecs.current = setTimeout(() => {
            if (playerState.current === 'PAUSED') setSides(prev => ({...prev, info: true}));
        }, 10000);
    }, [setSides, setSubtitlesAndUpNext, shareAndDownload]);

    const hideControls = useCallback(() => {
        fiveSecs.current && clearTimeout(fiveSecs.current);
        tenSecs.current && clearTimeout(tenSecs.current);
        setSides({info: false, controls: true, left: true, right: true});
        setSubtitlesAndUpNext({settings: false, subtitles: false, upNext: false});
        shareAndDownload({share: false, download: false});
    }, [setSides, setSubtitlesAndUpNext, shareAndDownload]);

    const setVolume = useCallback((current: number, add = true) => {
        if (player) {
            setSides(prev => ({...prev, left: true}));
            if (!cast.connected) {
                player.muted = false;
                player.volume = add ? player.volume + current > 1 ? 1 : player.volume + current < 0 ? 0 : player.volume + current : current;

            } else {
                const pos = add ? (chromecastEvent?.volume || 0) + current : current;
                cast.setCastVolume(pos);
            }

            twoSecs.current && clearTimeout(twoSecs.current);
            twoSecs.current = setTimeout(() => {
                setSides(prev => ({...prev, left: false}));
            }, 2000);
        }
        showControls();
    }, [player, cast.connected, cast.setCastVolume, setSides, showControls]);

    const switchLanguage = useCallback(async (activeSub?: string) => {
        if (response) {
            if (activeSub === undefined) {
                const lang = ['none'].concat(response.subs.map(s => s.language));
                let nextIndex = -1;
                setSubtitles(prev => {
                    const prevIndex = lang.findIndex(l => l === prev.activeSub);
                    nextIndex = (prevIndex + 1) >= lang.length ? 0 : prevIndex + 1;
                    base.makeRequest('/api/stream/switchLang', {language: lang[nextIndex]}, 'POST');
                    return {...prev, activeSub: lang[nextIndex]};
                })
                dispatch({
                    type: 'warn',
                    heading: 'Subtitle changed',
                    message: nextIndex === 0 ? 'Subtitles has been deactivated' : `Subtitle has been switched to ${lang[nextIndex]}`
                })
            } else setSubtitles(prev => {
                base.makeRequest('/api/stream/switchLang', {language: activeSub}, 'POST');
                return {...prev, activeSub};
            });
        }
    }, [response, setSubtitles]);

    const informDB = useCallback(async (current: number, duration: number) => {
        if (response?.guest && current > 299 && !response.frame) {
            await signOut();
            cast.disconnect();
        } else if (response?.inform) {
            setPos(current);
            const position = Math.floor((current / duration) * 1000);
            await base?.makeRequest('/api/stream/inform', {auth: response.location, position}, 'POST');
        }
    }, [response, base, cast.disconnect, signOut]);

    const seekVideo = useCallback((current: number, val: 'current' | 'add' | 'multiply') => {
        if (player) {
            let newVal = cast.connected ? (chromecastState?.time || 0) : player.currentTime;
            switch (val) {
                case 'current':
                    newVal = current;
                    break;
                case 'add':
                    newVal += current;
                    break;
                case 'multiply':
                    newVal = player.duration * current;
                    break;
            }

            cast.connected ? cast.seek(newVal) : player.currentTime = newVal;
            sendMessage({action: "skipped", data: newVal + 1});
        }
        showControls();
    }, [player, cast.connected, sendMessage, cast.seek, chromecastState, showControls]);

    const muteUnmute = useCallback(() => {
        if (player) {
            setSides(prev => ({...prev, left: true}));
            if (cast.connected) cast.muteUnmute(); else player.muted = !player.muted;

            twoSecs.current && clearTimeout(twoSecs.current);
            twoSecs.current = setTimeout(() => {
                setSides(prev => ({...prev, left: false}));
            }, 2000);
        }
        showControls();
    }, [player, cast.connected, cast.muteUnmute, setSides, showControls]);

    const toggleFS = useCallback(async (maximised: boolean) => {
        const holder = document.getElementById(fsADDR.fullscreen || '') as HTMLDivElement | null;
        if (holder) {
            if (maximised && !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (holder.requestFullscreen) await holder.requestFullscreen();

                else if (holder.webkitRequestFullscreen) await holder.webkitRequestFullscreen();

                else if (holder.msRequestFullscreen) await holder.msRequestFullscreen();

                else if (holder.mozRequestFullscreen) await holder.mozRequestFullscreen();
            } else {
                if (document.exitFullscreen) await document.exitFullscreen();

                else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();

                else if (document.msExitFullscreen) await document.msExitFullscreen();

                else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
            }
        }
        showControls();
    }, [fsADDR.fullscreen, showControls]);

    const togglePip = useCallback(async (bool: boolean) => {
        if (player) {
            if (document.pictureInPictureElement && !bool) {
                await document.exitPictureInPicture();
            } else {
                if (document.pictureInPictureEnabled && bool) {
                    await player.requestPictureInPicture();
                }
            }
        }
        showControls();
    }, [player, showControls]);

    const playNext = useCallback(async () => {
        if (upNext) {
            const location = upNext.location;
            await pushNext(location);
            await router.push(location);
        }
    }, [pushNext, router, upNext]);

    const handleVolumeChange = useCallback(() => {
        if (player) setVolumeState({
            volume: player.volume, mute: player.muted
        })
        showControls();
    }, [player, setVolumeState, showControls]);

    const syncSub = useCallback((language: string, sync: number) => {
        setSubSync(prev => {
            const temp = prev.filter(sub => sub.language !== language);
            temp.push({
                language, sync
            });
            return temp;
        });
    }, [setSubSync]);

    const getSubtitles = useCallback(async (response: SpringPlay) => {
        if (response && base) {
            const subtitles: FramesSubs[] = [];
            const subSync: { language: string, sync: number }[] = [];

            for await (const sub of response.subs) {
                const temp = await base.makeRequest<Sub[]>(sub.url, null, 'GET');
                subtitles.push({language: sub.language, data: temp || []});
                subSync.push({language: sub.language, sync: -50});
            }

            setSubSync(subSync);
            setSubtitles(prev => ({...prev, subtitles}));
        }
    }, [base, setSubtitles, setSubSync]);

    const getUpNext = useCallback(async (response: SpringPlay, tries = 0,) => {
        if (response && base) {
            const temp = await base.makeRequest<UpNext>('/api/stream/upNext?auth=' + response.location, null);
            if (temp) setUpNext(temp);

            else if (tries < 5) setTimeout(() => getUpNext(response, tries + 1), 1000);
        }
    }, [base, setUpNext]);

    const getEverything = useCallback((response: SpringPlay) => {
        let promises: any[] = [];
        promises.push(getUpNext(response));
        promises.push(getSubtitles(response));
        setFsADDR({fullscreen: base.generateKey(5, 13), startTime: Date.now()});
        return Promise.all(promises);
    }, [getUpNext, getSubtitles, setFsADDR, base]);

    const handleLoadedMetadata = useCallback(async () => {
        if (player) {
            setCurrent({current: player.currentTime, duration: player.duration, buffered: player.buffered});
            setSubtitles(prev => ({...prev, activeSub: response?.activeSub || 'none'}));
            if (!lobbyOpen) {
                try {
                    await player.play();
                    setPlayerState('PLAYING');
                    setHideImage(true);

                } catch (e: any) {
                    const error = e as DOMException;
                    setError(error.message);
                    setPlayerState('FAILED_TO_START');
                    setHideImage(false);
                }
            }

            setTimeout(() => {
                setSides(prev => ({...prev, left: false, right: false}));
            }, 1000);
        }
    }, [player, setCurrent, sendMessage, setError, setPlayerState, setHideImage, response, setSubtitles, lobbyOpen]);

    const handleTimeUpdate = useCallback(async (event: SyntheticEvent) => {
        const player = event.target as HTMLVideoElement;
        if (player) {
            const current = player.currentTime;
            const duration = player.duration;
            const buffered = player.buffered;
            setCurrent({current, duration, buffered});

            if (playing(player)) {
                setPlayerState(prev => {
                    if (prev === 'BUFFERING') sendMessage({action: 'buffering', data: false});
                    return 'PLAYING';
                });
                setHideImage(true);
            }

            let tracks = player.textTracks;
            for (let track of tracks) track.mode = "hidden";

            if (pos + 60 < current || current < pos) {
                sendMessage({action: 'inform', data: current});
                if (response?.inform || current >= 299 && isMounted())
                    await informDB(current, duration);
            }

            if (response?.autoPlay && (Math.floor(duration - current) === 0)) await playNext();
        }
    }, [playNext, sendMessage, informDB, pos, setCurrent, setPlayerState, setHideImage, response]);

    const handlePlayPause = useCallback(async () => {
        showControls();
        if (player && !player.paused) {
            setPlayerState("PLAYING");
        } else if (player) setPlayerState("PAUSED");
    }, [sendMessage, player, setPlayerState, showControls]);

    const handleWaiting = useCallback(() => {
        if (player) {
            setPlayerState("BUFFERING");
            sendMessage({action: 'buffering', data: true});
        }
    }, [sendMessage, player, setPlayerState]);

    const handleEnded = useCallback(() => {
        if (player) setPlayerState("ENDED");
    }, [player, setPlayerState]);

    const handleDurationChange = useCallback(async () => {
        if (player && response) {
            const current = player.currentTime = (response.position / 1000) * player.duration;
            setCurrent({current, duration: player.duration, buffered: player.buffered});
            player.autoplay = true;
            if (lobbyOpen)
                try {
                    await player.pause();
                } catch (e: any) {
                    const error = e as DOMException;
                    setError(error.message);
                    setPlayerState('FAILED_TO_START');
                    setHideImage(false);
                }
        }
    }, [setPlayerState, player, response, setCurrent, lobbyOpen]);

    const handleError = useCallback(() => {
        if (player && player.error) setError(player.error.message);
    }, [player, setError]);

    const playPause = useCallback(async (action?: boolean) => {
        const video = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        try {
            if (action !== undefined) {
                if (cast.connected)
                    cast.playPause();

                else if (video) {
                    if (action)
                        await video.play();
                    else
                        video.pause();
                }
            } else if (video && !cast.connected) {
                if (video.paused) {
                    await video.play();
                    sendMessage({action: "playing", data: true, playData: video.currentTime});
                } else {
                    video.pause();
                    sendMessage({action: "playing", data: false, playData: video.currentTime});
                }

            } else if (cast.connected) {
                sendMessage({action: "playing", data: !chromecastEvent?.paused, playData: chromecastState?.progress});
                cast.playPause();
            }
        } catch (e: any) {
            setError(e.message);
        }

        channel.modifyPresenceState(`watching ${response?.name}`);
        globalChannel.modifyPresenceState(`watching ${response?.name}`);
    }, [response, cast.connected, cast.playPause, sendMessage]);

    return {
        switchLanguage,
        seekVideo,
        player,
        playPause,
        handlePlayPause,
        handleWaiting,
        handleEnded,
        handleDurationChange,
        handleTimeUpdate,
        hideControls,
        getEverything,
        syncSub,
        handleError,
        castToDevice,
        showControls,
        handleLoadedMetadata,
        togglePip,
        toggleFS,
        setVolume,
        muteUnmute,
        handleVolumeChange,
        playNext
    }
}

export const VideoListener = () => {
    const playback = usePlayback();
    const player = useRecoilValue(framesPlayer);
    const error = useRecoilValue(FramesPlayerErrorAtom);
    const groupWatch = useRecoilValue(GroupWatchSide);
    const {share, download} = useRecoilValue(shareAndDownloadAtom);
    const {pip, fullscreen} = useRecoilValue(PipAndFullscreenAtom);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const setPipAndFullscreen = useSetRecoilState(PipAndFullscreenAtom);
    const setAirplay = useSetRecoilState(AirplayAtom);
    const dispatch = useInfoDispatch();

    useEffect(() => {
        error && dispatch({
            type: 'error', heading: 'An error occurred', message: error
        })
    }, [error])

    useEventListener('enterpictureinpicture', () => {
        setPipAndFullscreen(prev => ({...prev, pip: true}));
    }, player)

    useEventListener('leavepictureinpicture', () => {
        setPipAndFullscreen(prev => ({...prev, pip: false}));
    }, player)

    useEventListener('fullscreenchange', () => {
        const full = !!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
        setPipAndFullscreen(prev => ({...prev, fullscreen: full}));
    });

    useEventListener('msfullscreenchange', () => {
        const full = !!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
        setPipAndFullscreen(prev => ({...prev, fullscreen: full}));
    });

    useEventListener('mozfullscreenchange', () => {
        const full = !!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
        setPipAndFullscreen(prev => ({...prev, fullscreen: full}));
    });

    useEventListener('webkitfullscreenchange', () => {
        const full = !!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
        setPipAndFullscreen(prev => ({...prev, fullscreen: full}));
    });

    useEventListener('webkitplaybacktargetavailabilitychanged', event => {
        switch (event.availability) {
            case "available":
                setAirplay({available: true, casting: false});
                break;
            case "not-available":
                setAirplay({available: false, casting: false});
                break;
        }
    }, player);

    useEventListener('webkitcurrentplaybacktargetiswirelesschanged', event => {
        if (event.target.remote.state === "connected") setAirplay({
            available: true,
            casting: true
        }); else setAirplay({available: true, casting: false});
    }, player);

    useEventListener('keyup', async e => {
        if (!groupWatch && !download && !share) {
            switch (e.code) {
                case 'Space':
                    await playback.playPause();
                    break;

                case 'ArrowLeft':
                    await playback.seekVideo(-15, 'add');
                    break;

                case 'ArrowRight':
                    await playback.seekVideo(15, 'add');
                    break;

                case 'ArrowUp':
                    await playback.setVolume(0.1);
                    break;

                case 'ArrowDown':
                    await playback.setVolume(-0.1);
                    break;

                case 'KeyZ':
                    await playback.togglePip(!pip);
                    break;

                case 'KeyF':
                    await playback.toggleFS(!fullscreen);
                    break;

                case 'KeyS':
                    await playback.switchLanguage();
                    break;

                case 'KeyC':
                    setSubtitlesAndUpNext(prev => ({...prev, settings: !prev.settings}));
                    break;

                case 'KeyD':
                    await playback.playNext();
                    break;

                case 'KeyM':
                    await playback.muteUnmute();
                    break;

            }
        }

        await playback.showControls();
    })

    useEventListener('keydown', async e => {
        if (!groupWatch && !download && !share) {
            switch (e.code) {
                case 'KeyN':
                    //await playback.showNext(true);
                    break;
            }
        }
    })

    return null;
}
