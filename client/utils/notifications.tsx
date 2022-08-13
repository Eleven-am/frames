import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {NotificationInterface} from "../../server/classes/user";
import useUser, {ContextType, globalChannelSelector} from "./user";
import {PresenceInterface, useChannel} from "./realtime";
import React, {useCallback, useEffect, useRef, useState} from "react";
import NProgress from "nprogress";
import {default_t, subscribe, useBasics, useEventEmitter, useEventListener} from "./customHooks";
import styles from "../next/components/entities/Sections.module.css";
import {Image} from "../next/components/misc/Loader";
import frames from "../next/assets/frames.png";
import useBase, {useBaseCast, useGlobalKey} from "./provider";
import {GroupRoom, GroupWatchMessage, GroupWatchMessages} from "./groupWatch";
import {useRouter} from "next/router";
import usePlaybackControls, {
    AirplayAtom,
    framesPlayer,
    framesVideoStateAtom,
    fullscreenAddressAtom,
    PipAndFullscreenAtom,
    shareAndDownloadAtom,
    SubtitlesAndUpNextAtom,
    UpNextAtom
} from "./playback";
import {CastEvent, CastEventType} from "chomecast-sender";
import {ChromeCastStateAtom} from "./castContext";
import {CastEventAtom, VideoStateAtom} from "./castContext";
import {UserPlaybackSettingsContext} from "./modify";

interface Inform {
    type: 'user' | 'server' | 'error' | 'warn' | 'success';
    heading: string;
    message: string;
    confirm?: boolean;
    confirmText?: string;
    cancelText?: string;
    active?: boolean;
}

interface Confirm extends Inform {
    confirm: boolean;
    confirmText: string;
    cancelText: string;
}

const ConfirmDisplayContext = atom<Confirm | null>({
    key: 'ConfirmDisplayContext', default: null
})

const notificationsAtom = atom({
    key: 'notifications',
    default: [] as NotificationInterface[]
});

export const PresenceStatusAtom = atom<{ state: string, metadata?: default_t<string | null> } | null>({
    key: 'PresenceStatusAtom',
    default: null
})

export const notificationCount = selector({
    key: 'notificationCount',
    get: ({get}) => {
        const notifications = get(notificationsAtom);
        const unreadNotifications = notifications.filter(notification => !notification.opened);
        const count = unreadNotifications.length;
        return count > 0 ? count > 9 ? '9+' : '' + count : null;
    }
});

export const globalChannelKeyAtom = atom<string>({
    key: 'globalChannelKeyAtom',
    default: ''
})

export const AlreadyStreamingAtom = atom<{ name: string, backdrop: string; episodeName: string | null, logo: string | null } | null>({
    key: 'alreadyStreaming',
    default: null
});

export default function useNotifications() {
    const key = useGlobalKey();
    const {getBaseUrl} = useBasics();
    const room = useRecoilValue(GroupRoom);
    const confirmDispatch = useConfirmDispatch();
    const {user, signOut, signAsGuest} = useUser();
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const [state, setPresenceStatus] = useRecoilState(PresenceStatusAtom);
    const users = useRecoilValue(globalChannelSelector);

    const channel = useChannel(`notification:${user?.channel}`, {
        username: user?.username || '',
        identifier: `${userState?.incognito ? 'incognito:' : ''}${user?.identifier}`
    });

    const globalChannel = useChannel(`globalNotification:${key}`, {
        username: user?.username || '',
        identifier: `${userState?.incognito ? 'incognito:' : ''}${user?.identifier}`
    });

    const socket = useChannel(room || '', {
        username: user?.username || '',
        identifier: `${userState?.incognito ? 'incognito:' : ''}${user?.identifier}`
    });

    const broadcastToSelf = useCallback((temp: Omit<NotificationInterface, 'opened' | 'sender'>) => {
        const notification = {...temp, sender: user?.session || '', opened: true};
        channel.send('speak', notification);
    }, [channel, user]);

    const signOutEveryWhere = useCallback(async () => {
        NProgress.start();
        await fetch('/api/auth?action=clearSessions');
        broadcastToSelf({
            type: 'signOut',
            data: null,
            message: 'You have been signed out remotely',
            title: 'Remote sign out'
        });
        await signOut();
    }, [signOut, broadcastToSelf]);

    const modifyPresence = useCallback((presence: string, metadata?: default_t<string | null>) => {
        if (presence !== 'away')
            setPresenceStatus({state: presence, metadata});

        const payload = presence === 'away' && state?.metadata ? {payload: state.metadata} : metadata ? {payload: metadata} : undefined;
        socket.modifyPresenceState(presence, payload);
        channel.modifyPresenceState(presence, payload);
        globalChannel.modifyPresenceState(presence, payload);
    }, [socket, channel, globalChannel, state]);

    const connect = useCallback((user: (ContextType & {username: string}), incognito: boolean) => {
        channel.forceConnect(`notification:${user.channel}`, {
            username: user.username,
            identifier: `${incognito ? 'incognito:' : ''}${user.identifier}`
        });

        globalChannel.forceConnect(`globalNotification:${key}`, {
            username: user.username,
            identifier: `${incognito ? 'incognito:' : ''}${user.identifier}`
        });
    }, [key, globalChannel, channel]);

    const disconnect = useCallback(() => {
        socket.disconnect();
        channel.disconnect();
        globalChannel.disconnect();
    }, [socket, channel, globalChannel]);

    const requestToJoinSession = useCallback(async (otherUser?: PresenceInterface) => {
        if (otherUser === undefined) return;
        confirmDispatch({
            type: 'user',
            heading: 'Join session',
            message: `Do you want to join ${otherUser.username}'s GroupWatch session?`,
            onOk: () => globalChannel.whisper<NotificationInterface & { type: string }>(otherUser.reference, {
                type: 'requestGroupWatchSession',
                title: 'Join session',
                message: `${user?.username} wants to join your session`,
                opened: true,
                sender: user?.username || '',
                data: null
            }),
            confirm: true,
            confirmText: 'Join',
        })
    }, [globalChannel, user]);

    const inviteUser = useCallback(async (address: string, username: string) => {
        const url = getBaseUrl() + `/room=${room}`;
        confirmDispatch({
            type: 'warn',
            heading: 'Invite user',
            message: `Do you want to invite ${username} to join your GroupWatch session?`,
            onOk: () => globalChannel.whisper<NotificationInterface>(address, {
                type: 'groupWatchInvite',
                title: 'Invite to GroupWatch',
                message: `${user?.username} has invited you to join their GroupWatch session.`,
                opened: true,
                sender: user!.username,
                data: {url}
            }),
            confirmText: 'Invite',
            confirm: true
        })
    }, [globalChannel, user, getBaseUrl, room]);

    return {
        connect, user, signOut, signAsGuest, users,
        modifyPresence, disconnect, groupWatch: socket,
        notification: channel, globalNotification: globalChannel,
        requestToJoinSession, inviteUser, signOutEveryWhere, broadcastToSelf
    };
}

export const useConfirmDispatch = () => {
    const {subscribe} = useEventEmitter<boolean | null>('ConfirmButtonContext')
    const [dispatched, setDispatched] = useState(false);
    const setState = useSetRecoilState(ConfirmDisplayContext);
    const confirmRef = useRef<(() => void)>();
    const cancelRef = useRef<(() => void)>();

    subscribe(bool => {
        if (bool !== null && dispatched) {
            if (bool)
                confirmRef.current?.();
            else
                cancelRef.current?.();
            setDispatched(false);
        }
    })

    return (a: Inform & { onOk?: (() => void), onCancel?: (() => void) }) => {
        setDispatched(true);
        confirmRef.current = a.onOk;
        cancelRef.current = a.onCancel;
        setState({
            type: a.type,
            heading: a.heading,
            message: a.message,
            confirm: a.confirm || false,
            confirmText: a.confirmText || 'Confirm',
            cancelText: a.cancelText || 'Cancel',
            active: !!a.onOk || !!a.onCancel,
        })
    }
}

export const Conformation = () => {
    const timer = useRef<NodeJS.Timeout>();
    const timer2 = useRef<NodeJS.Timeout>();
    const timer3 = useRef<NodeJS.Timeout>();
    const [state, setState] = useRecoilState(ConfirmDisplayContext);
    const [drop, setDrop] = useState<boolean | null>(null);
    const {emit} = useEventEmitter<boolean | null>('ConfirmButtonContext');
    const [style, setStyle] = useState('');

    const manageState = useCallback(() => {
        setDrop(drop => {
            return drop === null ? drop : false
        });

        if (state) {
            timer.current && clearTimeout(timer.current);
            timer2.current && clearTimeout(timer2.current);
            timer3.current = setTimeout(() => {
                let time = 0;
                switch (state.type) {
                    case 'error':
                        setStyle(styles.e);
                        time = 7;
                        break;
                    case 'user':
                        setStyle(styles.u);
                        time = 10;
                        break;
                    case 'success':
                        setStyle(styles.a);
                        time = 3;
                        break;
                    case 'server':
                        setStyle(styles.f);
                        time = 5;
                        break;
                    case "warn":
                        setStyle(styles.w);
                        time = 5;
                        break;
                }

                setDrop(true);
                if (!state.confirm)
                    timer.current = setTimeout(() => {
                        setDrop(false);
                        timer2.current = setTimeout(() => {
                            setState(null)
                            setDrop(null);
                        }, 100)
                    }, time * 1000);
            }, drop === null ? 0 : 100)
        }
    }, [state, setState, drop, setDrop]);

    subscribe(manageState, state);

    const click = useCallback((a: boolean) => {
        emit(a);
        setDrop(false);
        timer2.current = setTimeout(() => {
            setState(null)
            setDrop(null);
            emit(null);
        }, 100);
    }, [emit])

    if (state)
        return (
            <div className={`${styles.infoCon} ${drop === null ? styles.s : drop ? styles.d : styles.p}`}>
                <div className={`${styles.hldr} ${style}`}>
                    <div className={styles.infoHolder2}>
                        <div className={styles.left}>
                            {state.type === 'error' && <svg viewBox="0 0 24 24">
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>}
                            {state.type === 'warn' && <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>}
                            {state.type === 'success' && <svg viewBox="0 0 24 24">
                                <polyline points="9 11 12 14 22 4"/>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>}
                            {state.type === 'user' && <svg viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>}
                            {state.type === 'server' && <Image className={styles.leftImg} src={frames}/>}
                        </div>

                        <div className={styles.right}>
                            <span style={{fontSize: 'Larger'}}>{state.heading}</span>
                            <br/>
                            <span>{state.message}</span>
                        </div>
                    </div>
                    {state.active && <div className={styles.confirmButtons}>
                        <button onClick={() => click(true)}>
                            {state.confirmText}
                        </button>
                        <div className={styles.spcr}/>
                        <button onClick={() => click(false)}>
                            {state.cancelText}
                        </button>
                    </div>}
                </div>
            </div>
        )

    return null;
}

export const Listeners = () => {
    const router = useRouter();
    const cast = useBaseCast();
    const {user, signOut} = useUser();
    const confirmDispatch = useConfirmDispatch();
    const presenceState = useRecoilValue(PresenceStatusAtom);
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const timeOut = useRef<NodeJS.Timeout>();
    const {connect, disconnect, notification, globalNotification, modifyPresence} = useNotifications();
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);
    const setCastState = useSetRecoilState(ChromeCastStateAtom);

    useEffect(() => {
        cast?.on(CastEventType.AVAILABLE, event => {
            setCastState(prev => ({...prev, available: true}));
            eventHandler(event);
        })

        cast?.on(CastEventType.DURATIONCHANGE, eventHandler)

        cast?.on(CastEventType.PLAYING, eventHandler)

        cast?.on(CastEventType.PAUSED, eventHandler)

        cast?.on(CastEventType.VOLUMECHANGE, eventHandler)

        cast?.on(CastEventType.CONNECT, event => {
            setCastState(prev => ({...prev, casting: true}));
            eventHandler(event);
        })

        cast?.on(CastEventType.DISCONNECT, () => {
            setCastState(prev => ({...prev, casting: false}));
            eventHandler(null);
        })

        cast?.on(CastEventType.TIMEUPDATE, eventHandler)

        cast?.on(CastEventType.ERROR, event => {
            confirmDispatch({
                type: 'error', heading: 'Cast Error', message: event.error?.error || 'Unknown error'
            })
        })

        cast?.on(CastEventType.END, () => eventHandler(null))

        cast?.on(CastEventType.BUFFERING, eventHandler)

        cast?.on(CastEventType.MUTED, eventHandler)
    }, [cast]);

    subscribe(({user , userState}) => {
        disconnect();
        timeOut.current && clearTimeout(timeOut.current);
        if (user && userState !== undefined) {
            timeOut.current = setTimeout(() => {
                connect(user, userState);
            }, 1000);
        }
    }, {user, userState: userState?.incognito});

    useEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible')
            modifyPresence('away');
        else if (presenceState)
            modifyPresence(presenceState.state, presenceState.metadata);
        else
            modifyPresence('online');
    })

    const eventHandler = useCallback((event: CastEvent | null) => {
        setEventState(event);
        if (event && event.state && event.state.time !== 0) setVideo(event.state);
    }, [setEventState, setVideo])

    globalNotification.subscribe<NotificationInterface & { type: string }>('shout', data => {
        switch (data.type) {
            case 'maintenance':
                confirmDispatch({
                    type: 'server',
                    heading: data.title,
                    message: data.message,
                })
                break;
            case 'error':
                confirmDispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                break;
        }
    });

    globalNotification.subscribe<{ body: NotificationInterface & { type: string }, from: string }>('whisper', async (data) => {
        switch (data.body.type) {
            case 'error':
                confirmDispatch({
                    type: 'error',
                    heading: data.body.title,
                    message: data.body.message,
                });
                break;
            case 'requestGroupWatchSession':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (!stream)
                    globalNotification.whisper<NotificationInterface & { type: string }>(data.from, {
                        type: 'error',
                        title: `No Media Stream`,
                        message: `${user?.username} is not streaming right now`,
                        data: null,
                        opened: true,
                        sender: user?.username || '',
                    })
                break;
            case 'groupWatchInvite':
                confirmDispatch({
                    type: 'user',
                    heading: data.body.title,
                    message: data.body.message,
                    confirm: true,
                    confirmText: 'Join',
                    cancelText: 'Decline',
                    onOk: async () => await router.push(data.body.data.url),
                    onCancel: () => {
                        globalNotification.whisper<NotificationInterface & { type: string }>(data.from, {
                            type: 'error',
                            title: 'Invite Declined',
                            message: `${user?.username} declined the invite to join your GroupWatch session`,
                            opened: true,
                            sender: user?.username || '',
                            data: null
                        })
                    },
                })
                break;
            case 'groupWatchSession':
                if (data.body.data && data.body.data.url) {
                    confirmDispatch({
                        type: 'success',
                        heading: data.body.title,
                        message: data.body.message,
                    });
                    await router.push(data.body.data.url);
                }
                break;
        }
    });

    notification.subscribe<NotificationInterface & { type: string }>('shout', async data => {
        switch (data.type) {
            case 'error':
                confirmDispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                break;
            case 'signOut':
                confirmDispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                await signOut();
                break;
            case 'playlistInvite':
                confirmDispatch({
                    type: 'user',
                    heading: data.title,
                    message: data.message,
                    confirm: false,
                    onOk: async () => await router.push(data.data),
                    confirmText: 'View playlist',
                    cancelText: 'Cancel',
                });
                break;
        }
    });

    return null;
}

export const WatchListener = () => {
    const router = useRouter();
    const base = useBase();
    const basics = useBasics();
    const playback = usePlaybackControls(false);
    const confirmDispatch = useConfirmDispatch();
    const player = useRecoilValue(framesPlayer);
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const setPipAndFullscreen = useSetRecoilState(PipAndFullscreenAtom);
    const setAirplay = useSetRecoilState(AirplayAtom);
    const [upNext, setUpNext] = useRecoilState(UpNextAtom);
    const {share, download} = useRecoilValue(shareAndDownloadAtom);
    const setMessages = useSetRecoilState(GroupWatchMessages);
    const resetPlayer = useResetRecoilState(framesPlayer);
    const videoState = useRecoilValue(framesVideoStateAtom);
    const {startTime} = useRecoilValue(fullscreenAddressAtom);
    const setState = useSetRecoilState(AlreadyStreamingAtom);
    const {room, genRoom, setLeader, leader, side, channel} = playback.groupWatch;
    const {notification, broadcastToSelf, user, globalNotification} = useNotifications();

    channel.onJoin(e => {
        if (e.phx_ref_prev === undefined) {
            const find = channel.online.find(p => p.username === e.username);
            if (channel.reference?.reference !== e.reference && e.username !== user?.username && !find) {
                confirmDispatch({
                    type: "success",
                    heading: "GroupWatch Session",
                    message: `${e.username} has joined the GroupWatch Session`
                });

                const nMsg = {
                    id: Date.now(),
                    username: e.username,
                    message: `${e.username} has joined the session`,
                    received: new Date()
                }

                setMessages(prev => [...prev, nMsg]);
            }
        }
    });

    channel.onLeave(e => {
        confirmDispatch({
            type: "warn",
            heading: "GroupWatch Session",
            message: `${e.username} has left the GroupWatch Session`
        });

        const nMsg = {
            id: Date.now(),
            username: e.username,
            message: `${e.username} has left the session`,
            received: new Date()
        }

        setMessages(prev => [...prev, nMsg]);
    });

    channel.onUpdate(e => {
        const clone = base.sortArray([...e], 'online_at', 'asc');
        const leader = clone[0];
        const refValue = channel.reference?.reference || '';
        setLeader(leader?.reference === refValue || leader?.identifier === user?.identifier);
    });

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
        if (!side && !download && !share) {
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
                    await playback.togglePip();
                    break;

                case 'KeyF':
                    await playback.toggleFS();
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
        if (!side && !download && !share) {
            switch (e.code) {
                case 'KeyN':
                    //await playback.showNext(true);
                    break;
            }
        }
    })

    channel.subscribe<GroupWatchMessage>('shout', async (message) => {
        const {action, username, data, upNext: msg, playData} = message;
        const nMsg = {
            id: Date.now(), username: username, message: '', received: new Date()
        }
        switch (action) {
            case 'playing':
                if (playData) playback.seekVideo(playData, 'current');

                await playback.playPause(data as boolean);
                nMsg.message = `${username} has ${data ? 'played' : 'paused'} the video`;
                break;

            case 'inform':
                playback.seekVideo(data as number, 'current');
                break;

            case 'buffering':
                const bool = data as boolean;
                await playback.playPause(!bool);
                confirmDispatch({
                    type: bool ? "error" : "success",
                    heading: `${bool ? 'Poor' : 'Established'} session connection`,
                    message: `${username} ${bool ? 'is trying to reconnect' : 'has reconnected'}`
                });

                nMsg.message = `${username} has ${bool ? 'lost connection' : 'reconnected'} to the group session`;
                break;

            case 'skipped':
                const frame = data as number
                await playback.seekVideo(frame, 'current');
                confirmDispatch({
                    type: "warn", heading: "Client skipped", message: `${username} skipped to frame ${Math.ceil(frame)}`
                });

                nMsg.message = `${username} skipped the video to frame ${Math.ceil(frame)}`;
                break;

            case 'request-sync':
                if (leader) channel.send<GroupWatchMessage>('shout', {
                    action: 'sync',
                    username: user?.username || '',
                    playData: playback.getCurrentTime(),
                    upNext
                });

                await playback.playPause(true);
                break;

            case 'sync':
                if (playData) playback.seekVideo(playData, 'current');
                await playback.playPause(true);
                setUpNext(msg || upNext);
                break;

            case 'says':
                const text = data as string;
                confirmDispatch({
                    type: "user", heading: "New chat received", message: `${username} says: ${text}`
                });

                nMsg.message = text;
                break;

            case 'next':
                await playback.playNext();
                break;
        }

        if (nMsg.message !== '') setMessages(prev => [...prev, nMsg]);
    });

    notification.subscribe<NotificationInterface & { type: string }>('shout', async data => {
        switch (data.type) {
            case 'streaming':
                if (videoState) {
                    const nData = {
                        name: videoState.name,
                        backdrop: videoState.backdrop,
                        episodeName: videoState.episodeName,
                        logo: videoState.logo,
                        startTime: startTime,
                    };

                    broadcastToSelf({
                        type: 'isStreaming',
                        title: 'Streaming',
                        message: `${startTime}`,
                        recipient: data.sender,
                        data: nData,
                    });
                }
                break;

            case 'isStreaming':
                if (data.data.startTime < startTime && data.recipient === user?.session)
                    setState(data.data);
                break;

            case 'doneStreaming':
                resetPlayer();
                setState(null);
                break;

            default:
                break;
        }
    });

    globalNotification.subscribe<{ body: NotificationInterface & { type: string }, from: string }>('whisper', async (data) => {
        switch (data.body.type) {
            case 'requestGroupWatchSession':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (stream && videoState)
                    if (userState?.incognito)
                        globalNotification.whisper<NotificationInterface & { type: string }>(data.from, {
                            type: 'error',
                            title: 'User is incognito',
                            message: `${user?.username} cannot GroupWatch because they are incognito`,
                            opened: true,
                            sender: user?.username || '',
                            data: null
                        })
                    else
                        confirmDispatch({
                            type: 'user', heading: data.body.title, message: data.body.message,
                            confirm: true, confirmText: 'Accept', cancelText: 'Decline',
                            onOk: async () => {
                                let roomKey: string;
                                if (!channel.connected) {
                                    const room = base.generateKey(13, 5);
                                    await genRoom(videoState.location, room);
                                    await router.replace(`/room=${room}`, undefined, {shallow: true})
                                    roomKey = room;

                                } else
                                    roomKey = room;

                                globalNotification.whisper<NotificationInterface>(data.from, {
                                    type: 'groupWatchSession',
                                    data: {url: `${basics.getBaseUrl()}/room=${roomKey}`},
                                    title: 'GroupWatch session',
                                    message: `${user?.username} has accepted your request to join their GroupWatch session`,
                                    opened: true,
                                    sender: user?.username || '',
                                });
                            },
                            onCancel: () => globalNotification.whisper<NotificationInterface & { type: string }>(data.from, {
                                    type: 'error',
                                    title: 'Offer Declined',
                                    message: `${user?.username} declined your offer to join their GroupWatch session`,
                                    opened: true,
                                    sender: user?.username || '',
                                    data: null
                                })
                        })
                break;
        }
    });

    return null;
}
