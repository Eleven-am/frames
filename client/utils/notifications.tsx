import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {NotificationInterface} from "../../server/classes/user";
import useUser, {ContextType} from "./user";
import {PresenceInterface, useChannel} from "./realtime";
import React, {createContext, memo, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from "react";
import NProgress from "nprogress";
import {subscribe, useBasics, useEventListener, useInterval, useTimer} from "./customHooks";
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
import {CastEventAtom, ChromeCastStateAtom, VideoStateAtom} from "./castContext";
import {UserPlaybackSettingsContext} from "./modify";
import {Role} from "@prisma/client";
import {Subject} from "rxjs";

const confirm$ = new Subject<boolean>();

const NotificationDialog = createContext({
    confirm$,
    users: [] as PresenceInterface[],
    groupWatchUsers: [] as PresenceInterface[],
})

interface NewNotification extends Required<NotificationInterface> {
    data: {
        url: string | null,
        image: string,
    }
}

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

export interface MetaData {
    logo: string | null,
    backdrop: string,
    name: string,
    poster: string,
    overview: string,

    [key: string]: string | null,
}

const ConfirmDisplayContext = atom<Confirm | null>({
    key: 'ConfirmDisplayContext', default: null
})

const notificationsAtom = atom({
    key: 'notifications',
    default: [] as  Omit<NotificationInterface, "message" | "data" | "type">[]
});

export const PresenceStatusAtom = atom<{ state: string, metadata?: MetaData } | null>({
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
    const base = useBase();
    const key = useGlobalKey();
    const {getBaseUrl} = useBasics();
    const room = useRecoilValue(GroupRoom);
    const confirmDispatch = useConfirmDispatch();
    const {user, signOut, signAsGuest} = useUser();
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const [state, setPresenceStatus] = useRecoilState(PresenceStatusAtom);

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

    const informServerOfInvite = useCallback((notification: NewNotification) => {
        console.log('informing server of invite', notification);
    }, [base]);

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

    const modifyPresence = useCallback((presence: string, metadata?: MetaData) => {
        if (presence !== 'away')
            setPresenceStatus({state: presence, metadata});

        const payload = presence === 'away' && state?.metadata ? {payload: state.metadata} : metadata ? {payload: metadata} : undefined;
        socket.modifyPresenceState(presence, payload);
        channel.modifyPresenceState(presence, payload);
        globalChannel.modifyPresenceState(presence, payload);
    }, [socket, channel, globalChannel, state]);

    const connect = useCallback((user: (ContextType & { username: string }), incognito: boolean) => {
        channel.forceConnect(`notification:${user.channel}`, {
            username: user.username,
            identifier: `${incognito ? 'incognito:' : ''}${user.identifier}`
        });

        globalChannel.forceConnect(`globalNotification:${key}`, {
            username: user.username,
            identifier: `${incognito ? 'incognito:' : ''}${user.identifier}`
        });

        if (room !== '' && !incognito)
            socket.forceConnect(room, {
                username: user.username,
                identifier: user.identifier
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
            onOk: () => {
                globalChannel.whisper<NotificationInterface>(otherUser.reference, {
                    type: 'requestGroupWatchSession',
                    title: 'Join session',
                    message: `${user?.username} wants to join your session`,
                    opened: true,
                    sender: user!.username,
                    data: null
                });

                informServerOfInvite({
                    title: 'Join session',
                    type: 'requestGroupWatchSession',
                    message: `${user?.username} wants to join your session`,
                    opened: false,
                    sender: user!.username,
                    recipient: otherUser.username,
                    data: {
                        url: null,
                        image: otherUser.metadata?.poster || '',
                    }
                })
            },
            confirm: true,
            confirmText: 'Join',
        })
    }, [globalChannel, user, informServerOfInvite]);

    const inviteUser = useCallback(async (address: string, username: string) => {
        const url = getBaseUrl() + `/room=${room}`;
        confirmDispatch({
            type: 'warn',
            heading: 'Invite user',
            message: `Do you want to invite ${username} to join your GroupWatch session?`,
            onOk: () => {
                globalChannel.whisper<NotificationInterface>(address, {
                    type: 'groupWatchInvite',
                    title: 'Invite to GroupWatch',
                    message: `${user?.username} has invited you to join their GroupWatch session.`,
                    opened: true,
                    sender: user!.username,
                    data: {url}
                })

                informServerOfInvite({
                    title: 'Invite to GroupWatch',
                    type: 'groupWatchInvite',
                    message: `${user?.username} has invited you to join their GroupWatch session.`,
                    opened: false,
                    sender: user!.username,
                    recipient: username,
                    data: {
                        url, image: state?.metadata?.poster || ''
                    }
                });
            },
            confirmText: 'Invite',
            confirm: true
        })
    }, [globalChannel, user, getBaseUrl, room, informServerOfInvite, state]);

    const forceSignOut = useCallback(async (otherUser?: PresenceInterface) => {
        if (otherUser === undefined || user?.role !== Role.ADMIN) return;
        confirmDispatch({
            type: 'warn',
            heading: 'Force sign out',
            message: `Do you want to force sign out ${otherUser.username}?`,
            onOk: () => globalChannel.whisper<NotificationInterface>(otherUser.reference, {
                type: 'adminRequestSignOut',
                title: 'Force sign out',
                message: `${user?.username} has forced you to sign out.`,
                opened: true,
                sender: user?.username,
                data: null
            }),
            confirmText: 'Force sign out',
            confirm: true
        })
    }, [globalChannel, user]);

    const forceReload = useCallback(async (otherUser?: PresenceInterface) => {
        if (otherUser === undefined || user?.role !== Role.ADMIN) return;
        confirmDispatch({
            type: 'warn',
            heading: 'Force reload',
            message: `Do you want to force reload ${otherUser.username}?`,
            onOk: () => globalChannel.whisper<NotificationInterface>(otherUser.reference, {
                type: 'adminRequestReload',
                title: 'Force reload',
                message: `${user?.username} has forced you to reload.`,
                opened: true,
                sender: user?.username,
                data: null
            }),
            confirmText: 'Force reload',
            confirm: true
        })
    }, [globalChannel, user]);

    const allConnected = useMemo(() => {
        return {
            notificationChannel: channel.connected || false,
            globalChannel: globalChannel.connected || false,
            groupWatchChannel: socket.connected || false
        }
    }, [channel, globalChannel, socket]);

    return {
        forceSignOut, forceReload,
        modifyPresence, disconnect, groupWatch: socket,
        allConnected, connect, user, signOut, signAsGuest,
        notification: channel, globalNotification: globalChannel,
        requestToJoinSession, inviteUser, signOutEveryWhere, broadcastToSelf
    };
}

export const useConfirmDispatch = () => {
    const {confirm$} = useContext(NotificationDialog);
    const setState = useSetRecoilState(ConfirmDisplayContext);

    return useCallback((a: Inform & { onOk?: (() => void), onCancel?: (() => void) }) => {
        const subscription = confirm$.subscribe(bool => {
            if (bool && a.onOk) a.onOk();
            else if (!bool && a.onCancel) a.onCancel();
            subscription.unsubscribe();
        });

        setState({
            type: a.type,
            heading: a.heading,
            message: a.message,
            confirm: a.confirm || false,
            confirmText: a.confirmText || 'Confirm',
            cancelText: a.cancelText || 'Cancel',
            active: !!a.onOk || !!a.onCancel,
        })
    }, [setState, confirm$]);
}

export const Conformation = memo(() => {
    const [style, setStyle] = useState('');
    const {start: startOne, stop: stopTwo} = useTimer();
    const {start: startTwo, stop: stopOne} = useTimer();
    const {start: startThree, stop: stopThree} = useTimer();
    const [state, setState] = useRecoilState(ConfirmDisplayContext);
    const [drop, setDrop] = useState<boolean | null>(null);
    const {confirm$} = useContext(NotificationDialog);

    const manageState = useCallback((state: Confirm | null) => {
        setDrop(drop => {
            return drop === null ? drop : false
        });

        if (state) {
            stopOne();
            stopTwo();
            stopThree();
            startThree(() => {
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
                    startOne(() => {
                        setDrop(false);
                        startTwo(() => {
                            setState(null)
                            setDrop(null);
                        }, 100)
                    }, time * 1000);
            }, drop === null ? 0 : 100)
        }
    }, [setState, drop, setDrop]);

    const click = useCallback((a: boolean) => {
        confirm$.next(a);
        setDrop(false);
        startTwo(() => {
            setState(null)
            setDrop(null);
        }, 100);
    }, [confirm$, setState, setDrop, startTwo]);

    subscribe(manageState, state);

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
})

const GroupWatchListener = memo(() => {
    const router = useRouter();
    const base = useBase();
    const basics = useBasics();
    const playback = usePlaybackControls(false);
    const [upNext, setUpNext] = useRecoilState(UpNextAtom);
    const confirmDispatch = useConfirmDispatch();
    const {startTime} = useRecoilValue(fullscreenAddressAtom);
    const setState = useSetRecoilState(AlreadyStreamingAtom);
    const setMessages = useSetRecoilState(GroupWatchMessages);
    const resetPlayer = useResetRecoilState(framesPlayer);
    const videoState = useRecoilValue(framesVideoStateAtom);
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const {room, genRoom, setLeader, leader, channel} = playback.groupWatch;
    const {notification, broadcastToSelf, user, globalNotification} = useNotifications();

    channel.onJoin(e => {
        if (e.phx_ref_prev === undefined) {
            confirmDispatch({
                type: "success",
                heading: "GroupWatch Session",
                message: `${e.username} has joined the GroupWatch Session`
            });

            const nMsg = {
                id: Date.now(),
                username: e.username,
                message: `${e.username} has joined the session`,
                received: new Date(),
                isNotification: true,
                isUser: false,
            }

            setMessages(prev => [...prev, nMsg]);
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
            received: new Date(),
            isNotification: true,
            isUser: false,
        }

        setMessages(prev => [...prev, nMsg]);
    });

    channel.onUpdate(e => {
        const clone = base.sortArray([...e], 'online_at', 'asc');
        const leader = clone[0];
        const refValue = channel.reference?.reference || '';
        setLeader(leader?.reference === refValue || leader?.identifier === user?.identifier);
    });

    channel.subscribe<GroupWatchMessage>('shout', async (message) => {
        const {action, username, data, upNext: msg, playData} = message;
        const nMsg = {
            id: Date.now(), username: username, message: '', received: new Date(), isNotification: true, isUser: false,
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
                nMsg.isNotification = false;
                break;

            case 'next':
                await playback.playNext();
                break;
        }

        if (nMsg.message !== '') setMessages(prev => [...prev, nMsg]);
    });

    notification.subscribe<NotificationInterface>('shout', async data => {
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

    globalNotification.subscribe<{ body: NotificationInterface, from: string }>('whisper', async (data) => {
        switch (data.body.type) {
            case 'requestGroupWatchSession':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (stream && videoState)
                    if (userState?.incognito || user?.role === Role.GUEST)
                        globalNotification.whisper<NotificationInterface & { type: string }>(data.from, {
                            type: 'error',
                            title: user?.role === Role.GUEST ? 'Unauthorised action' : 'User is incognito',
                            message: `${user?.username} cannot GroupWatch because they are ${userState?.incognito ? 'incognito' : 'a guest user'}`,
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
})

export const WatchListener = memo(() => {
    const playback = usePlaybackControls(true);
    const player = useRecoilValue(framesPlayer);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const setPipAndFullscreen = useSetRecoilState(PipAndFullscreenAtom);
    const setAirplay = useSetRecoilState(AirplayAtom);
    const {share, download} = useRecoilValue(shareAndDownloadAtom);

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
        if (!playback.groupWatch.side && !download && !share) {
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
        if (!playback.groupWatch.side && !download && !share) {
            switch (e.code) {
                case 'KeyN':
                    //await playback.showNext(true);
                    break;
            }
        }
    })

    return <GroupWatchListener/>;
});

export const NotificationDialogProvider = memo(({children}: { children: ReactNode }) => {
    const router = useRouter();
    const cast = useBaseCast();
    const {start, stop} = useTimer();
    const {user, signOut, getNotifications} = useUser();
    const confirmDispatch = useConfirmDispatch();
    const setNotifications = useSetRecoilState(notificationsAtom);
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);
    const presenceState = useRecoilValue(PresenceStatusAtom);
    const setCastState = useSetRecoilState(ChromeCastStateAtom);
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const {
        allConnected,
        connect,
        disconnect,
        notification,
        groupWatch,
        globalNotification,
        modifyPresence,
    } = useNotifications();

    useInterval(async () => {
        if (user) {
            const notifications = await getNotifications();
            setNotifications(notifications);
        }
    },60 * 5);

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

    subscribe(({user, userState}) => {
        stop();
        disconnect();
        if (user && userState !== undefined) {
            start(async () => {
                connect(user, userState);
                const notifications = await getNotifications();
                setNotifications(notifications);
            }, 100);
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

    const users = useMemo(() => {
        const users = globalNotification.users;
        if (user?.role === Role.ADMIN)
            return users.map(e => ({
                ...e,
                username: `${e.identifier.startsWith('incognito:') ? 'Incognito: ' : ''}${e.username}`
            }));

        else if (userState?.incognito)
            return [];

        else
            return users.filter(u => !u.identifier.startsWith('incognito:'));
    }, [globalNotification.users, user, userState]);

    const groupWatchUsers = useMemo(() => {
        const users = groupWatch.users;
        if (user?.role === Role.ADMIN)
            return users.map(e => ({
                ...e,
                username: `${e.identifier.startsWith('incognito:') ? 'Incognito: ' : ''}${e.username}`
            }));

        else if (userState?.incognito)
            return [];

        else
            return users.filter(u => !u.identifier.startsWith('incognito:'));
    }, [groupWatch.users, user, userState]);

    subscribe(() => modifyPresence(presenceState?.state || 'online', presenceState?.metadata), allConnected)

    const eventHandler = useCallback((event: CastEvent | null) => {
        setEventState(event);
        if (event && event.state && event.state.time !== 0) setVideo(event.state);
    }, [setEventState, setVideo])

    globalNotification.subscribe<NotificationInterface>('shout', data => {
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

    globalNotification.subscribe<{ body: NotificationInterface, from: string }>('whisper', async (data) => {
        switch (data.body.type) {
            case 'error':
                confirmDispatch({
                    type: 'error',
                    heading: data.body.title,
                    message: data.body.message,
                });
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
            case 'adminRequestReload':
                confirmDispatch({
                    type: 'error',
                    heading: data.body.title,
                    message: data.body.message,
                });
                window.location.reload();
                break;
            case 'adminRequestSignOut':
                confirmDispatch({
                    type: 'error',
                    heading: data.body.title,
                    message: data.body.message,
                })
                await signOut();
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
        }
    });

    notification.subscribe<NotificationInterface>('shout', async data => {
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
            case 'newNotification':
                confirmDispatch({
                    type: 'server',
                    heading: data.title,
                    message: data.message,
                })
                const newNotifications = await getNotifications();
                setNotifications(newNotifications);
                break;
        }
    });

    return (
        <NotificationDialog.Provider value={{confirm$, users, groupWatchUsers}}>
            {children}
            <Conformation/>
        </NotificationDialog.Provider>
    )
})

export const useGroupWatchUsers = () => useContext(NotificationDialog).groupWatchUsers;
export const useUsers = () => useContext(NotificationDialog).users;
