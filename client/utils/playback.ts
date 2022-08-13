import {SpringPlay, Sub} from "../../server/classes/playback";
import {atom, selector, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {UpNext} from "../../server/classes/media";
import useCast, {CastEventAtom, ChromeCastStateAtom, VideoStateAtom} from "./castContext";
import useNotifications, {AlreadyStreamingAtom, PresenceStatusAtom, useConfirmDispatch} from "./notifications";
import {SyntheticEvent, useCallback, useRef, useState} from "react";
import useBase from "./provider";
import {useRouter} from "next/router";
import {Role} from "@prisma/client";
import {Message, useGroupWatch} from "./groupWatch";
import {SideBarAtomFamily} from "../next/components/misc/sidebar";
import {useManageUserInfo, UserPlaybackSettingsContext} from "./modify";
import {useInterval, useTimer} from "./customHooks";

export interface FramesSubs {
    language: string;
    data: Sub[];
}

type PLAYER_TYPE = 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'ENDED' | 'FAILED_TO_START';

export const displaySidesAtom = atom<{ left: boolean, right: boolean, info: boolean, controls: boolean }>({
    key: 'displaySides', default: {
        left: true, info: false, right: true, controls: true
    }
})

export const shareAndDownloadAtom = atom<{ share: boolean, download: boolean, settings: boolean }>({
    key: 'shareAndDownload', default: {
        share: false, download: false, settings: false
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

export const framesVideoStateAtom = atom<SpringPlay | null>({
    key: 'framesVideoState', default: null,
});

export const currentDuration = atom<{ current: number, duration: number, buffered: TimeRanges | null }>({
    key: 'currentDuration', default: {current: 0, duration: 0, buffered: null}
});

export const framesPlayer = atom<HTMLVideoElement | null>({
    key: 'framesPlayer', default: null
});

export const framesPlayerStateAtom = atom<PLAYER_TYPE>({
    key: 'framesPlayerState', default: 'BUFFERING'
});

export const volumeFrameAtom = atom<{ volume: number, mute: boolean }>({
    key: 'volumeFrame', default: {
        volume: 1, mute: false
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

export const VideoInformAtom = selector<{ autoplay: boolean, inform: boolean }>({
    key: 'VideoInformAtom',
    get: ({get}) => {
        const startTime = get(fullscreenAddressAtom).startTime;
        const response = get(framesVideoStateAtom);
        const informer = get(UserPlaybackSettingsContext);

        if (startTime !== 0 && informer && response) {
            return {
                autoplay: informer.timestamp > startTime ? informer.autoplay : response.autoplay,
                inform: informer.timestamp > startTime ? informer.inform : response.inform
            }
        }

        return {
            autoplay: informer?.autoplay || response?.autoplay || false,
            inform: informer?.inform || response?.inform || false,
        }
    }
});

export const SubtitlesSyncAtom = atom<{ language: string, sync: number }[]>({
    key: 'SubtitlesSync', default: []
})

export const AirplayAtom = atom<{ available: boolean, casting: boolean }>({
    key: 'Airplay', default: {
        available: false, casting: false
    }
})

export const fullscreenAddressAtom = atom<{ fullscreen: string | null, startTime: number }>({
    key: 'fullscreenAddress', default: {
        fullscreen: null, startTime: 0
    }
})

export const AirplaySelector = selector<{ available: boolean, casting: boolean, protocol: 'cast' | 'airplay' }>({
    key: 'AirplaySelector', get: ({get}) => {
        const airplay = get(AirplayAtom);
        const cast = get(ChromeCastStateAtom);

        return {
            available: airplay.available || cast.available,
            casting: airplay.casting || cast.casting,
            protocol: airplay.available ? 'airplay' : 'cast'
        }
    }
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

export const VolumeSelector = selector({
    key: 'VolumeSelector', get: ({get}) => {
        const {volume, mute} = get(volumeFrameAtom);
        const state = get(CastEventAtom);

        if (state) return {volume: state.volume, mute: state.muted};

        else return {volume, mute};
    }
});

export const framesPlayerStateSelector = selector({
    key: 'framesPlayerStateSelector', get: ({get}) => {
        const state = get(CastEventAtom);
        if (state?.connected) return state.buffering ? 'BUFFERING' : state.paused ? 'PAUSED' : 'PLAYING';

        return get(framesPlayerStateAtom);
    }
});

export const SubtitlesAtom = selector({
    key: 'SubtitlesAtom', get: ({get}) => {
        let {current} = get(FramesInformAtom);
        const playing = get(framesPlayerStateAtom) === 'PLAYING';
        const subSync = get(SubtitlesSyncAtom);
        const {subtitles, activeSub} = get(framesSubtitlesAtom);
        const moveSub = get(displaySidesAtom).controls;
        const casting = get(AirplaySelector).casting;

        if (current > 0 && subtitles.length) {
            const sub = subtitles.find(e => e.language === activeSub);
            const sync = subSync.find(e => e.language === activeSub);
            current = (current * 1000) + (sync?.sync || 0);
            if (sub) {
                const display = sub.data.find(e => e.start <= current && current <= e.end);
                if (display && playing && !casting)
                    return {
                        move: moveSub, display: display.text, style: display.style
                    }
            }
        }

        return null;
    }
});

export const differance = selector<string | null>({
    key: 'differenceSelector', get: ({get}) => {
        const {current, duration} = get(FramesInformAtom);
        const autoplay = get(VideoInformAtom).autoplay
        const {difference} = get(PipAndFullscreenAtom);

        if ((duration > current) && (difference || (autoplay && (duration - current < 60))))
            return Math.ceil(duration - current) + 's';

        return null;
    }
});

function playing(video: HTMLVideoElement) {
    return (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 3);
}

export const cleanUp = () => {
    const response = useRecoilValue(framesVideoStateAtom);
    const fullscreenReset = useResetRecoilState(fullscreenAddressAtom);
    const framesVideoStateReset = useResetRecoilState(framesVideoStateAtom);
    const currentReset = useResetRecoilState(currentDuration);
    const framesReset = useResetRecoilState(framesPlayer);
    const setState = useSetRecoilState(SideBarAtomFamily('framesSettings'));
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
    const CastEventReset = useResetRecoilState(CastEventAtom);
    const CastStateReset = useResetRecoilState(VideoStateAtom);
    const AirplayReset = useResetRecoilState(AirplayAtom);
    const alreadyStreamingReset = useResetRecoilState(AlreadyStreamingAtom);

    return (cb?: (a: SpringPlay | null) => void) => {
        cb && cb(response);
        fullscreenReset();
        framesVideoStateReset();
        currentReset();
        framesReset();
        setState(false);
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
        CastEventReset();
        CastStateReset();
        AirplayReset();
        alreadyStreamingReset();
    }
}

export const useDefaultControls = () => {
    const player = useRecoilValue(framesPlayer);
    const response = useRecoilValue(framesVideoStateAtom);
    const groupWatch = useGroupWatch();
    const {start: startFiveSecs, stop: stopFiveSecs} = useTimer();
    const {start: startTenSecs, stop: stopTenSecs} = useTimer();
    const setSides = useSetRecoilState(displaySidesAtom);
    const shareAndDownload = useSetRecoilState(shareAndDownloadAtom);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const playerState = useRef<PLAYER_TYPE>('BUFFERING');
    const setPState = useSetRecoilState(framesPlayerStateAtom);

    const showControls = useCallback(() => {
        stopFiveSecs();
        stopTenSecs();
        setSides(prev => ({...prev, info: false, controls: true}));

        startFiveSecs(() => {
            setSides(prev => ({...prev, info: false, controls: false}));
            setSubtitlesAndUpNext({settings: false, subtitles: false, upNext: false});
        }, 5000);

        startTenSecs(() => {
            if (playerState.current === 'PAUSED') setSides(prev => ({...prev, info: true}));
        }, 10000);
    }, [setSides, setSubtitlesAndUpNext, playerState]);

    const setPlayerState = useCallback((state: PLAYER_TYPE | ((p: PLAYER_TYPE) => PLAYER_TYPE)) => {
        const val = typeof state === 'function' ? state(playerState.current) : state;
        setPState(val);
        playerState.current = val;
    }, [setPState]);

    return {showControls, groupWatch, setPlayerState, response, player, setSides, shareAndDownload};
}

export const useLeftControls = () => {
    const cast = useCast();
    const castState = useRecoilValue(AirplaySelector);
    const chromecastEvent = useRecoilValue(CastEventAtom);
    const {start: startTwoSecs, stop: stopTwoSecs} = useTimer();
    const volumeDisplay = useRecoilValue(VolumeSelector);
    const {response, showControls, setSides, player, shareAndDownload} = useDefaultControls();

    const castToDevice = useCallback(async () => {
        if (castState.available) {
            if (castState.protocol === 'airplay') {
                const player = document.getElementById(response?.playerId || '') as HTMLVideoElement;
                if (player && player.webkitShowPlaybackTargetPicker) await player.webkitShowPlaybackTargetPicker();

            } else if (castState.protocol === 'cast') await cast.handleCastBtnClick();
        }
    }, [response, castState, cast.handleCastBtnClick]);

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

            stopTwoSecs();
            startTwoSecs(() => {
                setSides(prev => ({...prev, left: false}));
            }, 2000);
        }
        showControls();
    }, [player, cast.connected, cast.setCastVolume, setSides, showControls]);

    const muteUnmute = useCallback(() => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        if (player) {
            setSides(prev => ({...prev, left: true}));
            if (cast.connected) cast.muteUnmute(); else player.muted = !player.muted;

            stopTwoSecs();
            startTwoSecs(() => {
                setSides(prev => ({...prev, left: false}));
            }, 2000);
        }
        showControls();
    }, [response, cast.connected, cast.muteUnmute, setSides, showControls]);

    const toggleShare = useCallback(() => {
        shareAndDownload(prev => ({...prev, share: !prev.share}));
    }, [shareAndDownload]);

    const toggleDownload = useCallback(() => {
        shareAndDownload(prev => ({...prev, download: !prev.download}));
    }, [shareAndDownload]);

    return {setVolume, muteUnmute, toggleShare, toggleDownload, volumeDisplay, mirroring: castState, castToDevice};
}

export const useRightControls = () => {
    const router = useRouter();
    const {user, signOut, modifyPresence} = useNotifications();
    const base = useBase();
    const upNext = useRecoilValue(UpNextAtom);
    const fsADDR = useRecoilValue(fullscreenAddressAtom);
    const setSubtitles = useSetRecoilState(framesSubtitlesAtom);
    const {
        response,
        showControls,
        player,
        groupWatch: {pushNext, disconnect, connected, openSession: open, openCHat, channel: {online}}
    } = useDefaultControls();
    const {getUserDetails} = useManageUserInfo()
    const setState = useSetRecoilState(SideBarAtomFamily('framesSettings'));
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const dispatch = useConfirmDispatch();

    const toggleFS = useCallback(async () => {
        const holder = document.getElementById(fsADDR.fullscreen || '') as HTMLDivElement | null;
        if (holder) {
            if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
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

    const togglePip = useCallback(async () => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        if (player) {
            if (document.pictureInPictureElement)
                await document.exitPictureInPicture();
            else if (document.pictureInPictureEnabled)
                await player.requestPictureInPicture();
        }
        showControls();
    }, [response, showControls]);

    const playNext = useCallback(async () => {
        if (upNext) {
            const location = upNext.location;
            await pushNext(location);
            await router.push(location);
        }
    }, [pushNext, router, upNext]);

    const toggleSettings = useCallback(() => {
        setState(state => !state);
    }, [setState]);

    const toggleSession = useCallback(async () => {
        if (response) {
            if (connected) {
                disconnect();
                await router.replace(`/watch=${response.location}`, undefined, {shallow: true});

            } else {
                if (user?.role === Role.GUEST) {
                    dispatch({
                        type: "error",
                        heading: "Unauthorised action attempt",
                        message: 'Guest accounts cannot create or join GroupWatch'
                    })

                    return;
                }

                player && player.pause();
                await open({location: response.location, id: response.mediaId});
            }
        }
    }, [connected, dispatch, player, router, open, user, response]);

    const hoverSubtitle = useCallback((hovering: boolean) => {
        if (hovering)
            setSubtitlesAndUpNext(prev => ({...prev, subtitles: true}));
        else
            setTimeout(() => setSubtitlesAndUpNext(prev => ({...prev, subtitles: false})), 200);
    }, [setSubtitlesAndUpNext]);

    const hoverUpNext = useCallback((hovering: boolean) => {
        if (hovering)
            setSubtitlesAndUpNext(prev => ({...prev, upNext: true}));
        else
            setTimeout(() => setSubtitlesAndUpNext(prev => ({...prev, upNext: false})), 200);
    }, [setSubtitlesAndUpNext]);

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
            await getUserDetails();
        }
    }, [response, setSubtitles, dispatch, getUserDetails, base]);

    return {
        signOut,
        switchLanguage,
        playNext,
        toggleFS,
        togglePip,
        toggleSettings,
        toggleSession,
        hoverSubtitle, modifyPresence,
        hoverUpNext, getUserDetails,
        connected, users: online,
        toggleChat: openCHat,
        isGuest: user?.role === Role.GUEST
    };
}

export const useCentreControls = (inform: boolean) => {
    const cast = useCast();
    const dispatch = useConfirmDispatch();
    const chromecastEvent = useRecoilValue(CastEventAtom);
    const chromecastState = useRecoilValue(VideoStateAtom);
    const {response, showControls, groupWatch: {sendMessage: send, lobbyOpen}} = useDefaultControls();
    const display = useRecoilValue(PlaybackDisplayInformation);

    const sendMessage = useCallback((message: Message) => {
        if (inform) send(message);
    }, [send]);

    const seekVideo = useCallback((current: number, val: 'current' | 'add' | 'multiply') => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
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
    }, [response, cast.connected, sendMessage, cast.seek, chromecastState, showControls]);

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
            dispatch({
                type: "error",
                heading: "Playback Error",
                message: e.message || 'An error occurred while trying to play the video'
            })
        }

    }, [response, cast.connected, cast.playPause, sendMessage]);

    return {playPause, seekVideo, display, sendMessage, lobbyOpen};
}

export const usePlaybackControlsListener = (inform: boolean) => {
    const cast = useCast();
    const base = useBase();
    const setCurrent = useSetRecoilState(currentDuration);
    const setHideImage = useSetRecoilState(HideImageAtom);
    const presenceState = useRecoilValue(PresenceStatusAtom);
    const setVolumeState = useSetRecoilState(volumeFrameAtom);
    const setSubtitles = useSetRecoilState(framesSubtitlesAtom);
    const {inform: informServer, autoplay} = useRecoilValue(VideoInformAtom);
    const dispatch = useConfirmDispatch();
    const [pos, setPos] = useState(0);
    const {sendMessage, lobbyOpen} = useCentreControls(inform);
    const {playNext, signOut, modifyPresence} = useRightControls();
    const {response, showControls, player, setPlayerState, setSides} = useDefaultControls();

    const {clear, restart} = useInterval(() => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        if (player && playing(player)) {
            setPlayerState(prev => {
                if (prev === 'BUFFERING')
                    sendMessage({action: 'buffering', data: false});
                return 'PLAYING';
            });
            setHideImage(true);
            clear();
        }
    }, 0.01);

    const informDB = useCallback(async (current: number, duration: number, media: SpringPlay | null) => {
        if (media?.guest && current > 299 && !media.frame) {
            await signOut();
            cast.disconnect();
        } else if (informServer) {
            setPos(current);
            const position = Math.floor((current / duration) * 1000);
            sendMessage({action: 'inform', data: current});
            await base?.makeRequest('/api/stream/inform', {auth: media?.location, position}, 'POST');
        }

        if (media) {
            if (presenceState?.metadata?.backdrop === media.backdrop)
                return;

            const {logo, name, overview, backdrop} = media;
            modifyPresence(`watching ${name}`, {logo, name, overview, backdrop});
        }
    }, [presenceState, sendMessage, base, signOut, cast.disconnect, informServer, setPos]);

    const handleVolumeChange = useCallback(() => {
        if (player) setVolumeState({
            volume: player.volume, mute: player.muted
        })
        showControls();
    }, [player, setVolumeState, showControls]);

    const handleLoadedMetadata = useCallback(async () => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        if (player) {
            clear();
            setCurrent({current: player.currentTime, duration: player.duration, buffered: player.buffered});
            setSubtitles(prev => ({...prev, activeSub: response?.activeSub || 'none'}));
            if (!lobbyOpen) {
                try {
                    await informDB(player.currentTime, player.duration, response);
                    await player.play();
                    setPlayerState('PLAYING');
                    setHideImage(true);

                } catch (e: any) {
                    const error = e as DOMException;
                    setPlayerState('FAILED_TO_START');
                    dispatch({
                        type: "error",
                        heading: "Playback Error",
                        message: error.message
                    });
                }
            }

            setTimeout(() => {
                setSides(prev => ({...prev, left: false, right: false}));
            }, 1000);
        }
    }, [response, informDB, dispatch, setPlayerState, setHideImage, setSides, setSubtitles, clear, lobbyOpen]);

    const handleTimeUpdate = useCallback(async (event: SyntheticEvent) => {
        const player = event.target as HTMLVideoElement;
        if (player) {
            const current = player.currentTime;
            const duration = player.duration;
            const buffered = player.buffered;
            setCurrent({current, duration, buffered});

            let tracks = player.textTracks;
            for (let track of tracks) track.mode = "hidden";

            if (((pos + 60 < current || current < pos) && informServer) || (response?.guest && current > 299 && !response.frame))
                await informDB(current, duration, response);

            if (autoplay && (Math.floor(duration - current) === 0)) await playNext();
        }
    }, [informDB, response, sendMessage, autoplay, pos, informServer, setCurrent, setPlayerState, setHideImage]);

    const handlePlayPause = useCallback(async () => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        showControls();
        if (player && !player.paused) {
            setPlayerState("PLAYING");
        } else if (player) setPlayerState("PAUSED");
    }, [sendMessage, response, setPlayerState, showControls]);

    const handleWaiting = useCallback(() => {
        if (player) {
            restart();
            setPlayerState("BUFFERING");
            sendMessage({action: 'buffering', data: true});
        }
    }, [player, restart, sendMessage, setPlayerState]);

    const handleEnded = useCallback(() => {
        if (player) setPlayerState("ENDED");
    }, [player, setPlayerState]);

    const handleDurationChange = useCallback(async () => {
        const player = (document.getElementById(response?.playerId || '') as HTMLVideoElement | null);
        if (player && response) {
            const current = player.currentTime = (response.position / 1000) * player.duration;
            setCurrent({current, duration: player.duration, buffered: player.buffered});
            if (lobbyOpen)
                try {
                    await player.play();
                } catch (e: any) {
                    const error = e as DOMException;
                    setPlayerState('FAILED_TO_START');
                    dispatch({
                        type: "error",
                        heading: "Playback Error",
                        message: error.message
                    });
                }
        }
    }, [setPlayerState, response, setCurrent, lobbyOpen]);

    const handleError = useCallback((event: SyntheticEvent) => {
        const player = event.target as HTMLVideoElement;
        if (player) {
            dispatch({
                type: "error",
                heading: "Playback Error",
                message: player.error?.message || "Unknown Error"
            });
        }
    }, [setPlayerState, dispatch]);

    return {
        response,
        handleLoadedMetadata, handleDurationChange,
        handleVolumeChange, handleTimeUpdate, handlePlayPause,
        handleWaiting, handleEnded, handleError, showControls,
    };
}

export default function usePlaybackControls(inform = true) {
    const base = useBase();
    const defaultControls = useDefaultControls();
    const leftControls = useLeftControls();
    const rightControls = useRightControls();
    const centerControls = useCentreControls(inform);
    const listener = usePlaybackControlsListener(inform);
    const setSubSync = useSetRecoilState(SubtitlesSyncAtom);
    const setSubtitles = useSetRecoilState(framesSubtitlesAtom);
    const setUpNext = useSetRecoilState(UpNextAtom);
    const setFsADDR = useSetRecoilState(fullscreenAddressAtom);

    const getSubtitles = useCallback(async (response: SpringPlay) => {
        if (response && base) {
            const subtitles: FramesSubs[] = [];
            const subSync: { language: string, sync: number }[] = [];

            for await (const sub of response.subs) {
                const temp = await base.makeRequest<Sub[]>(sub.url, null, 'GET');
                if (temp) {
                    subtitles.push({language: sub.language, data: temp || []});
                    subSync.push({language: sub.language, sync: -50});
                }
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
        promises.push(rightControls.getUserDetails());
        promises.push(getUpNext(response));
        promises.push(getSubtitles(response));
        setFsADDR({fullscreen: base.generateKey(5, 13), startTime: Date.now()});
        return Promise.all(promises);
    }, [getUpNext, getSubtitles, setFsADDR, base, rightControls.getUserDetails]);

    const getCurrentTime = useCallback(() => {
        const player = (document.getElementById(defaultControls.response?.playerId || '') as HTMLVideoElement | null);
        if (player) return player.currentTime;
        return 0;
    }, [defaultControls.response]);

    return {
        ...defaultControls,
        ...centerControls, ...leftControls,
        ...rightControls, ...listener, getEverything, getCurrentTime
    }
}
