import {useCallback} from "react";
import useUser from "./user";
import {atom, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {Role} from "@prisma/client";
import {useRouter} from "next/router";
import {framesPlayer} from "./playback";
import {UpNext} from "../../server/classes/media";
import {useChannel} from "./realtime";
import NProgress from "nprogress";
import {FrameMediaLite} from "../../server/classes/playback";
import {useConfirmDispatch, useGroupWatchUsers} from "./notifications";
import useBase from "./provider";
import {SideBarAtomFamily} from "../next/components/misc/sidebar";
import {UserPlaybackSettingsContext} from "./modify";
import {useNavBar} from "../next/components/navbar/navigation";

const GroupLeader = atom({
    key: 'GroupLeader', default: false
})

export const GroupWatchSection = atom({
    key: 'GroupWatchSection', default: 1
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

export interface GroupWatchMessagesInterface {
    id: number;
    message: string;
    username: string;
    received: Date;
    isNotification: boolean;
    isUser: boolean;
}

export const GroupWatchMessages = atom<GroupWatchMessagesInterface[]>({
    key: 'GroupWatchMessages', default: []
})

export interface Message {
    action: 'playing' | 'buffering' | 'skipped' | 'join' | 'says' | 'next' | 'leader' | 'nextHolder' | 'request-sync' | 'sync' | 'inform' | 'displayInfo'
    data?: boolean | number | string;
    playData?: number;
    upNext?: UpNext | null;
    reference?: string;
    payload?: any;
}

export interface GroupWatchMessage extends Message {
    username: string;
}

export function useGroupWatch() {
    const {user} = useUser();
    const {goBack} = useNavBar();
    const users = useGroupWatchUsers();
    const [side, setSide] = useRecoilState(SideBarAtomFamily('GroupWatchSlider'));
    const setSection = useSetRecoilState(GroupWatchSection);
    const [med, setId] = useRecoilState(GroupWatchMediaIdAtom);
    const [leader, setLeader] = useRecoilState(GroupLeader);
    const [room, setRoom] = useRecoilState(GroupRoom);
    const player = useRecoilValue(framesPlayer);
    const connected = useRecoilValue(ConnectedAtom);
    const addMessage = useSetRecoilState(GroupWatchMessages);
    const resetMessages = useResetRecoilState(GroupWatchMessages);
    const userState = useRecoilValue(UserPlaybackSettingsContext);
    const dispatch = useConfirmDispatch();
    const router = useRouter();
    const base = useBase();

    const socket = useChannel(room || '', {
        username: user?.username || '',
        identifier: `${userState?.incognito ? 'incognito:' : ''}${user?.identifier}`
    });

    const addNewMessage = useCallback((message: string, isNotification: boolean) => {
        if (user) {
            const nMsg = {
                id: Date.now(),
                isUser: true,
                username: user.username,
                message: message,
                received: new Date(),
                isNotification: isNotification
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
            addMessage([]);
            socket.forceConnect(room, {username: user?.username || '', identifier: user?.identifier || ''});
        }
    }, [user, connected, setRoom, socket, dispatch])

    const sendMessage = useCallback((message: Message) => {
        if (!leader) {
            if (message.action === 'inform' || message.action === 'displayInfo')
                return;
        }

        socket.send<GroupWatchMessage>('speak', {...message, username: user?.username || ''});

        let messageString = '';
        let isNotification = true;
        switch (message.action) {
            case 'says':
                messageString = message.data as string;
                isNotification = false;
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
            addNewMessage(messageString, isNotification);
    }, [leader, addNewMessage, user, socket])

    const joinRoom = useCallback(async (room: string) => {
        if (user?.role === Role.GUEST) dispatch({
            type: "error",
            heading: "Unauthorised action attempt",
            message: 'Guest accounts cannot create or join GroupWatch Sessions'
        })

        else if (userState?.incognito)
            dispatch({
                type: "error",
                heading: "Unauthorised action attempt",
                message: 'Incognito accounts cannot create or join GroupWatch Sessions'
            });

        else if (!socket.connected)
            connect(room);
    }, [user, userState, dispatch, connect, socket.connected])

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

    const genRoom = useCallback(async (auth: string, room?: string) => {
        if (user?.role === Role.GUEST) dispatch({
            type: "error",
            heading: "Unauthorised action attempt",
            message: 'Guest accounts cannot create or join GroupWatch'
        })

        else if (userState?.incognito)
            dispatch({
                type: "error",
                heading: "Unauthorised action attempt",
                message: 'Incognito accounts cannot create or join GroupWatch Sessions'
            });

        if (!socket.connected) {
            const roomKey = room || base.generateKey(13, 5);
            await base.makeRequest('/api/stream/groupWatch', {auth, roomKey}, 'POST');
            connect(roomKey);
        }
    }, [user, userState, dispatch, connect, socket.connected, base]);

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
            } else if (userState?.incognito) {
                dispatch({
                    type: "error",
                    heading: "Unauthorised action attempt",
                    message: 'Incognito accounts cannot create or join GroupWatch Sessions'
                });
                return;
            }

            player && player.pause();
            setId(data);
        }
    }, [user, userState, dispatch, socket.connected, player, router]);

    const closeGroupWatch = useCallback(() => {
        setSection(1);
        setSide(false);
    }, [setSection, setSide]);

    const openCHat = useCallback(() => {
        setSection(2);
        setSide(true);
    }, [setSection, setSide]);

    const startSession = useCallback(async (playPause: (a: boolean) => void) => {
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
            closeGroupWatch();
            goBack();
        }
        NProgress.done();
    }, [router, room, med, closeGroupWatch, sendMessage, goBack, setId]);

    const endSession = useCallback(async (playPause: (a: boolean) => void, response?: FrameMediaLite) => {
        if (response && router.asPath.includes('room')) {
            const url = '/info?mediaId=' + response.id;
            const asPath = `/${response.type.toLowerCase()}=${response.name.replace(/\s/g, '+')}`;
            await router.push(url, asPath);
        } else {
            if (router.asPath.includes('watch='))
                await playPause(true);

            goBack();
            disconnect();
            setId(null);
            closeGroupWatch();
        }
    }, [router, goBack, closeGroupWatch, disconnect, setId]);

    return {
        room: room || '',
        channel: socket,
        disconnect,
        sendMessage,
        pushNext,
        genRoom,
        updateRoom, openCHat,
        setLeader, closeGroupWatch,
        leader, startSession, endSession,
        joinRoom, openSession,
        connected: socket.connected || false,
        lobbyOpen: !!med, side, users
    };
}
