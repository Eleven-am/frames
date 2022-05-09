import {useCallback, useEffect, useRef} from "react";
import useUser from "./userTools";
import {atom, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {MediaType, Role} from "@prisma/client";
import {useRouter} from "next/router";
import {useInfoDispatch} from "../next/components/misc/inform";
import {useEventListener} from "./customHooks";
import usePlayback, {FramesInformAtom, framesPlayer, UpNextAtom} from "./playback";
import {UpNext} from "../../server/classes/media";
import {useChannel} from "./realtime";
import {useBase} from "./Providers";
import NProgress from "nprogress";
import {NavSectionAndOpacity} from "../next/components/navbar/navigation";
import {FrameMediaLite} from "../../server/classes/playBack";

const GroupLeader = atom({
    key: 'GroupLeader', default: false
})

export const GroupWatchSide = atom({
    key: 'GroupWatch', default: false
})

const ConnectedAtom = atom({
    key: 'Connected', default: false
})

export const GroupWatchMediaIdAtom = atom<{ auth?: string, id: number, location?: string } | null>({
    key: 'GroupWatchMediaId', default: null
})

export const GroupRoom = atom({
    key: 'GroupRoom', default: ''
})

interface GroupWatchMessages {
    id: number,
    message: string,
    username: string,
    received: Date,
}

export const GroupWatchMessages = atom<GroupWatchMessages[]>({
    key: 'GroupWatchMessages', default: []
})

export interface Message {
    action: 'playing' | 'buffering' | 'skipped' | 'join' | 'says' | 'next' | 'leader' | 'nextHolder' | 'request-sync' | 'sync' | 'inform'
    data?: boolean | number | string;
    playData?: number;
    upNext?: UpNext | null;
    reference?: string;
}

export interface GroupWatchMessage extends Message {
    username: string;
}

export function useGroupWatch() {
    const {user} = useUser();
    const setSide = useSetRecoilState(GroupWatchSide);
    const setState = useSetRecoilState(NavSectionAndOpacity);
    const [med, setId] = useRecoilState(GroupWatchMediaIdAtom);
    const [leader, setLeader] = useRecoilState(GroupLeader);
    const [room, setRoom] = useRecoilState(GroupRoom);
    const player = useRecoilValue(framesPlayer);
    const addMessage = useSetRecoilState(GroupWatchMessages);
    const resetMessages = useResetRecoilState(GroupWatchMessages);
    const connected = useRecoilValue(ConnectedAtom);
    const dispatch = useInfoDispatch();
    const router = useRouter();
    const base = useBase();
    const socket = useChannel(room, {username: user?.username || ''});

    const addNewMessage = useCallback((message: string) => {
       if (user){
           const nMsg = {
               id: Date.now(),
               username: user.username,
               message: message,
               received: new Date()
           }

           addMessage((prev) => [...prev, nMsg])
       }
    }, [addMessage, user])

    const connect = useCallback((room: string) => {
        if (user?.role === Role.GUEST) dispatch({
            type: "error",
            heading: "Unauthorised action attempt",
            message: 'Guest accounts cannot create or join GroupWatch'
        })

        else if (!connected) {
            setRoom(room);
            socket.forceConnect(room, {username: user?.username || ''});
        }
    }, [user, connected, setRoom, socket, dispatch])

    const sendMessage = useCallback((message: Message) => {
        if (!leader) {
            if (message.action === 'inform')
                return;

            else if (message.action === 'playing')
                message.playData = undefined;
        }

        socket.send<GroupWatchMessage>('speak', {...message, username: user?.username || ''});

        let messageString = '';
        switch (message.action) {
            case 'says':
                messageString = message.data as string;
                break;

            case 'playing':
                const playBool = message.data as boolean;
                messageString = `You have ${playBool ? 'played' : 'paused'} the video`;
                break;

            case 'buffering':
                const buffBool = message.data as boolean;
                messageString = `You have ${buffBool ? 'lost connection' : 'reconnected'} to the video session`;
                break;

            case 'skipped':
                messageString = `You skipped the video to the frame ${Math.ceil(message.data as number)}`;
                break;
        }

        if (messageString !== '')
            addNewMessage(messageString);
    }, [socket.send, leader, user, room, addNewMessage]);

    const joinRoom = useCallback(async (room: string) => {
        if (user?.role === Role.GUEST) dispatch({
            type: "error",
            heading: "Unauthorised action attempt",
            message: 'Guest accounts cannot create or join GroupWatch Sessions'
        })

        else {
            connect(room);
        }
    }, [user, dispatch, setRoom, connect]);

    const updateRoom = useCallback(async (auth: string) => {
        if (leader && connected && base) await base.makeRequest('/api/stream/groupWatch', {
            auth,
            roomKey: room
        }, 'POST');
    }, [leader, connected, room, base]);

    const pushNext = useCallback((data: string) => {
        if (leader) sendMessage({action: "next", data});
    }, [leader, sendMessage]);

    const disconnect = useCallback(() => {
        setRoom('');
        resetMessages();
        connected && dispatch({
            type: "warn", heading: "GroupWatch Session", message: 'You have left the GroupWatch Session'
        });
        setLeader(false);
        socket.disconnect();
    }, [sendMessage, socket.disconnect, dispatch]);

    const genRoom = useCallback(async (auth: string) => {
        if (user?.role === Role.GUEST) dispatch({
            type: "error",
            heading: "Unauthorised action attempt",
            message: 'Guest accounts cannot create or join GroupWatch'
        })

        else if (base) {
            if (!socket.connected) {
                const roomKey = base.generateKey(13, 5);
                await base.makeRequest('/api/stream/groupWatch', {auth, roomKey}, 'POST');
                connect(roomKey);
            }
        }
    }, [user, base, dispatch, connect, socket.connected, disconnect]);

    const openSession = useCallback(async (data: { id: number, auth?: string, location?: string }) => {
        if (socket.connected) {
            socket.disconnect();
            data.location && await router.replace(`/watch=${data.location}`, undefined, {shallow: true});
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
            setId(data);
        }
    }, [setId, socket.connected, socket.disconnect, user, player]);

    const startSession = useCallback(async (playPause: (a : boolean) => void) => {
        NProgress.start();
        const url = `/room=${room}`;
        const asPath = `/watch=${med?.location}`;
        if (router.asPath !== url && router.asPath !== asPath)
            await router.push(url);

        else {
            if (router.asPath.includes('watch=')) {
                await router.replace(url, undefined, {shallow: true});
                await playPause(true);

            } else {
                if (leader)
                    await playPause(true);
                else
                    sendMessage({action: 'request-sync'});
            }

            setId(null);
            setSide(false);
            setState({section: 'watch', opacity: 1});
        }
        NProgress.done();
    }, [router, room, med, setId, setSide, setState, leader, sendMessage]);

    const endSession = useCallback(async (playPause: (a : boolean) => void, response?: FrameMediaLite) => {
        if (response && router.asPath.includes('room')) {
            const url = '/info?mediaId=' + response.id;
            const asPath = `/${response.type.toLowerCase()}=${response.name.replace(/\s/g, '+')}`;
            await router.push(url, asPath);
        } else {
            if (router.asPath.includes('watch=')) {
                setState({section: 'watch', opacity: -1});
                await playPause(true);
            } else
                setState({section: response?.type === MediaType.MOVIE ? 'movies' : 'tv shows', opacity: 1});

            disconnect();
            setId(null);
            setSide(false);
        }
    }, [router, setId, setSide, setState, disconnect]);

    return {
        room,
        channel: socket,
        disconnect,
        sendMessage,
        pushNext,
        genRoom,
        updateRoom,
        setLeader,
        leader, startSession, endSession,
        joinRoom, openSession,
        connected: socket.connected,
        lobbyOpen: !!med
    };
}

export function GroupWatchListener() {
    const base = useBase();
    const {user} = useUser();
    const dispatch = useInfoDispatch();
    const room = useRecoilValue(GroupRoom);
    const playback = usePlayback(false);
    const {leader, setLeader} = useGroupWatch();
    const {current} = useRecoilValue(FramesInformAtom);
    const [upNext, setUpNext] = useRecoilState(UpNextAtom);
    const setMessages = useSetRecoilState(GroupWatchMessages);
    const channel = useChannel(room, {username: user?.username || ''});
    const refs = useRef<{ reference: string, next: UpNext | null, current: number }>({
        reference: '',
        next: null,
        current: 0
    });
    const visibleRef = useRef(false);

    useEffect(() => {
        refs.current = {
            reference: channel.reference?.reference || '', next: upNext, current: current
        };
    }, [current, upNext, channel.reference]);

    useEventListener('visibilitychange', event => {
        if (event.srcElement.hidden) {
            visibleRef.current = false;
            setTimeout(() => {
                if (!visibleRef.current) channel.modifyPresenceState('away');
            }, 1000);
        } else {
            visibleRef.current = true;
            channel.modifyPresenceState('online');
        }
    })

    channel.onJoin(e => {
        if (e.phx_ref_prev === undefined) {
            const find = channel.online.find(p => p.username === e.username);
            if (e.reference !== refs.current.reference && e.username !== user?.username && !find) {
                dispatch({
                    type: "alert",
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

    channel.onUpdate(e => {
        const clone = base.sortArray([...e], 'online_at', 'asc');
        const leader = clone[0];
        const refValue = refs.current.reference;
        setLeader(leader?.reference === refValue || leader?.username === user?.username);
    });

    channel.subscribe<GroupWatchMessage>('shout', async (message) => {
        const {action, username, data, upNext, playData} = message;
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
                    type: bool ? "error" : "alert",
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
                if (leader) channel.send<GroupWatchMessage>('speak', {
                    action: 'sync', username: user?.username || '', data: current, upNext: upNext,
                });
                break;
            case 'sync':
                const syncCurrent = Math.ceil(data as number);
                const presentCurrent = Math.ceil(refs.current.current);
                if (presentCurrent + 1 < syncCurrent || presentCurrent - 1 > syncCurrent) {
                    await playback.seekVideo(syncCurrent, 'current');
                    setUpNext(upNext || null);
                }
                break;
            case 'says':
                const text = data as string;
                dispatch({
                    type: "alert", heading: "New chat received", message: `${username} says: ${text}`
                });

                nMsg.message = text;
                break;
            case 'next':
                await playback.playNext();
                break;
        }

        if (nMsg.message !== '') setMessages(prev => [...prev, nMsg]);
    });

    return null;
}
