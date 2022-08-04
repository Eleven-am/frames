import {atom} from "recoil";

export const ChromeCastStateAtom = atom<{ available: boolean, casting: boolean }>({
    key: 'ChromeCastState', default: {
        available: false, casting: false
    }
})

/*export default function Listeners() {
    const base = useBase();
    const cast = useBaseCast();
    const basics = useBasics();
    const key = useGlobalKey();
    const playback = usePlaybackControls();
    const {user, signOut} = useUser();
    const groupWatch = useGroupWatch();
    const dispatch = useConfirmDispatch();
    const notification = useNotification();
    const globalChannel = useGlobalChannel();
    const player = useRecoilValue(framesPlayer);
    const timeout = useRef<NodeJS.Timeout>();
    const visibleRef = useRef(false);
    const {current} = useRecoilValue(FramesInformAtom);
    const setMessages = useSetRecoilState(GroupWatchMessages);
    const videoState = useRecoilValue(framesVideoStateAtom);
    const resetPlayer = useResetRecoilState(framesPlayer);
    const setIsStreaming = useSetRecoilState(AlreadyStreamingAtom);
    const startTime = useRecoilValue(fullscreenAddressAtom).startTime;
    const {share, download} = useRecoilValue(shareAndDownloadAtom);
    const [{pip, fullscreen}, setPipAndFullscreen] = useRecoilState(PipAndFullscreenAtom);
    const [upNext, setUpNext] = useRecoilState(UpNextAtom);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const setAirplay = useSetRecoilState(AirplayAtom);
    const setVideo = useSetRecoilState(VideoStateAtom);
    const setEventState = useSetRecoilState(CastEventAtom);
    const setCastState = useSetRecoilState(ChromeCastStateAtom);
    const eventHandler = (event: CastEvent | null) => {
        setEventState(event);
        if (event && event.state && event.state.time !== 0) setVideo(event.state);
    }

    const {router} = useDetectPageChange();

    notification.channel.subscribe<NotificationInterface>('shout', async data => {
        switch (data.type) {
            case 'streaming':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (videoState && stream) {
                    const nData = {
                        name: videoState.name,
                        backdrop: videoState.backdrop,
                        episodeName: videoState.episodeName,
                        logo: videoState.logo,
                        startTime: startTime,
                    };

                    notification.broadcastToSelf({
                        type: 'isStreaming',
                        title: 'Streaming',
                        message: `${startTime}`,
                        recipient: data.sender,
                        data: nData,
                    });
                }
                break;

            case 'isStreaming':
                if (data.data && data.data.startTime < startTime && data.recipient === user?.session)
                    setIsStreaming(data.data);
                break;

            case 'doneStreaming':
                resetPlayer();
                setIsStreaming(null);
                break;

            case 'signOut':
                dispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                await signOut();
                break;

            case 'playlistInvite':
                dispatch({
                    type: 'user',
                    heading: data.title,
                    message: data.message,
                    confirm: false,
                    onOk: async () => {
                        await router.push(data.data);
                    },
                    onCancel: () => {
                    },
                    confirmText: 'View playlist',
                    cancelText: 'Cancel',
                });
                break;

            default:
                break;
        }
    })

    globalChannel.channel.subscribe<NotificationInterface & { type: string }>('shout', data => {
        switch (data.type) {
            case 'maintenance':
                dispatch({
                    type: 'server',
                    heading: data.title,
                    message: data.message,
                    confirm: false,
                    onOk: () => {
                    },
                    onCancel: () => {
                    },
                    confirmText: 'OK',
                    cancelText: 'Cancel'
                })
                break;
        }
    })

    globalChannel.channel.subscribe<{ body: NotificationInterface & { type: string }, from: string }>('whisper', async ({body: data, from}) => {
        switch (data.type) {
            case  'requestGroupWatchSession':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (!stream)
                    globalChannel.channel.whisper<NotificationInterface & { type: string }>(from, {
                        type: 'error',
                        title: `No Media Stream`,
                        message: `${user?.username} is not streaming right now`,
                        data: null,
                        opened: true,
                        sender: user?.username || '',
                    })
                break;

            case 'groupWatchInvite':
                dispatch({
                    type: 'user',
                    heading: data.title,
                    message: data.message,
                    confirm: true,
                    confirmText: 'Join',
                    cancelText: 'Decline',
                    onOk: async () => {
                        await router.push(data.data.url);
                    },
                    onCancel: () => {
                        globalChannel.channel.whisper<NotificationInterface & { type: string }>(from, {
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

            case 'error':
                dispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                break;

            case 'groupWatchSession':
                if (data.data && data.data.url) {
                    dispatch({
                        type: 'success',
                        heading: data.title,
                        message: data.message,
                    });
                    await router.push(data.data.url);
                }
                break;

            default:
                break;
        }
    })

    globalChannel.channel.subscribe<{ body: NotificationInterface & { type: string }, from: string, username: string }>('whisper', async ({body: data, from, username}) => {
        switch (data.type) {
            case  'requestGroupWatchSession':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath);
                if (stream && videoState)
                    dispatch({
                        type: 'user', heading: 'GroupWatch Session',
                        message: `${username} wants to join your GroupWatch Session`,
                        confirm: true, confirmText: 'Accept', cancelText: 'Decline',
                        onOk: async () => {
                            let roomKey: string;
                            if (!groupWatch.channel.connected) {
                                const room = base.generateKey(13, 5);
                                await groupWatch.genRoom(videoState.location, room);
                                roomKey = room;

                            } else
                                roomKey = groupWatch.room;

                            globalChannel.channel.whisper<NotificationInterface>(from, {
                                type: 'groupWatchSession',
                                data: {url: `${basics.getBaseUrl()}/room=${roomKey}`},
                                title: 'GroupWatch session',
                                message: `${user?.username} has accepted your request to join their GroupWatch session`,
                                opened: true,
                                sender: user?.username || '',
                            })
                            dispatch({
                                type: 'success',
                                heading: 'GroupWatch session',
                                message: `${data.sender} has joined a GroupWatch session with you`
                            })
                        },
                        onCancel: async () => {
                            globalChannel.channel.whisper<NotificationInterface & { type: string }>(from, {
                                type: 'error',
                                title: 'Offer Declined',
                                message: `${user?.username} declined your offer to join their GroupWatch session`,
                                opened: true,
                                sender: user?.username || '',
                                data: null
                            })
                        }
                    })
                break;
        }
    })

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

    useEventListener('enterpictureinpicture', () => {
        setPipAndFullscreen(prev => ({...prev, pip: true}));
    }, player)

    useEventListener('leavepictureinpicture', () => {
        setPipAndFullscreen(prev => ({...prev, pip: false}));
    }, player)

    useEventListener('webkitcurrentplaybacktargetiswirelesschanged', event => {
        if (event.target.remote.state === "connected") setAirplay({
            available: true,
            casting: true
        }); else setAirplay({available: true, casting: false});
    }, player);

    useEventListener('keyup', async e => {
        if (!groupWatch && !download && !share && player) {
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
    });

    useEventListener('visibilitychange', event => {
        timeout.current && clearTimeout(timeout.current);
        if (event.srcElement.hidden) {
            visibleRef.current = false;
            timeout.current = setTimeout(() => {
                if (!visibleRef.current) {
                }
                //channel.modifyPresenceState('away');
            }, 1000);
        } else {
            visibleRef.current = true;
            //channel.modifyPresenceState('online');
        }
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

    groupWatch.channel.onJoin(e => {
        if (e.phx_ref_prev === undefined) {
            const find = groupWatch.channel.online.find(p => p.username === e.username);
            if (groupWatch.channel.reference?.reference !== e.reference && e.username !== user?.username && !find) {
                dispatch({
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

    groupWatch.channel.onLeave(e => {
        dispatch({
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

    groupWatch.channel.onUpdate(e => {
        const clone = base.sortArray([...e], 'online_at', 'asc');
        const leader = clone[0];
        const refValue = groupWatch.channel.reference?.reference || '';
        groupWatch.setLeader(leader?.reference === refValue || leader?.identifier === user?.identifier);
    });

    groupWatch.channel.subscribe<GroupWatchMessage>('shout', async (message) => {
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
                dispatch({
                    type: bool ? "error" : "success",
                    heading: `${bool ? 'Poor' : 'Established'} session connection`,
                    message: `${username} ${bool ? 'is trying to reconnect' : 'has reconnected'}`
                });

                nMsg.message = `${username} has ${bool ? 'lost connection' : 'reconnected'} to the group session`;
                break;

            case 'skipped':
                const frame = data as number
                await playback.seekVideo(frame, 'current');
                dispatch({
                    type: "warn", heading: "Client skipped", message: `${username} skipped to frame ${Math.ceil(frame)}`
                });

                nMsg.message = `${username} skipped the video to frame ${Math.ceil(frame)}`;
                break;

            case 'request-sync':
                if (groupWatch.leader) groupWatch.channel.send<GroupWatchMessage>('speak', {
                    action: 'sync', username: user?.username || '', data: current, upNext: upNext,
                });
                break;

            case 'sync':
                const syncCurrent = Math.ceil(data as number);
                const presentCurrent = Math.ceil(current);
                if (presentCurrent + 1 < syncCurrent || presentCurrent - 1 > syncCurrent) {
                    await playback.seekVideo(syncCurrent, 'current');
                    setUpNext(msg || null);
                }
                break;

            case 'says':
                const text = data as string;
                dispatch({
                    type: "success", heading: "New chat received", message: `${username} says: ${text}`
                });

                nMsg.message = text;
                break;

            case 'next':
                await playback.playNext();
                break;
        }

        if (nMsg.message !== '') setMessages(prev => [...prev, nMsg]);
    });

    subscribe(async () => {
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
            dispatch({
                type: 'error', heading: 'Cast Error', message: event.error?.error || 'Unknown error'
            })
        })

        cast?.on(CastEventType.END, () => eventHandler(null))

        cast?.on(CastEventType.BUFFERING, eventHandler)

        cast?.on(CastEventType.MUTED, eventHandler)

    }, cast);

    subscribe(async user => {
       if (user) {
            notification.channel.disconnect();
            globalChannel.channel.disconnect();

            notification.channel.forceConnect(`notification:${user.channel}`, {username: user.username, identifier: user.identifier});
            globalChannel.channel.forceConnect(`globalNotification:${key}`, {username: user.username, identifier: user.identifier});
        } else {
            notification.channel.disconnect();
            globalChannel.channel.disconnect();
        }
    }, user);

    return null;
}*/