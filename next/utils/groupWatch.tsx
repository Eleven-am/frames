import {createContext, ReactNode, useCallback, useContext, useEffect} from "react";
import {useWeSocket} from "./customHooks";
import useUser from "./userTools";
import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {InformDisplayContext} from "../components/misc/inform";
import {Role} from "@prisma/client";
import {pFetch} from "./baseFunctions";
import {generateKey} from "../../server/base/baseFunctions";
import {UpNextHolder} from "../../server/classes/playback";
import {GroupWatchListener, nextHolder} from "../states/FramesStates";
import {useRouter} from "next/router";

export interface Message {
    action: 'joined' | 'left' | 'playing' | 'buffering' | 'skipped' | 'join' | 'says' | 'declare' | 'inform' | 'next' | 'leader' | 'nextHolder'
    data?: boolean | number | string;
    upNext?: UpNextHolder
}

export interface GroupWatchMessage extends Message {
    client?: string;
    self?: boolean;
    userName: string;
    watchRoom: string;
}

const GroupLeader = atom({
    key: 'GroupLeader',
    default: false
})

const GroupRoom = atom({
    key: 'GroupRoom',
    default: ''
})

interface GroupWatchContextInterface {
    connect: () => void;
    disconnect: () => void;
    sendData: (arg: GroupWatchMessage) => void;
    data: GroupWatchMessage | undefined;
    connected: boolean;
}

const SOCKET = 'wss://pi7rdkzuqf.execute-api.eu-west-3.amazonaws.com/production';

const GroupWatchContext = createContext<GroupWatchContextInterface>({
    connected: false,
    data: undefined,
    sendData: () => {
    },
    disconnect: () => {
    },
    connect: () => {
    },
});

export function GroupWatchProvider({children}: { children: ReactNode }) {
    const {connect, connected, data, sendData, disconnect} = useWeSocket<GroupWatchMessage>(SOCKET);

    return (
        <GroupWatchContext.Provider value={{connected, connect, disconnect, data, sendData}}>
            <GroupWatchListener/>
            {children}
        </GroupWatchContext.Provider>
    )
}

export default function useGroupWatch(join = false) {
    const {user} = useUser();
    const dispatch = useSetRecoilState(InformDisplayContext);
    const [leader, setLeader] = useRecoilState(GroupLeader);
    const [room, setRoom] = useRecoilState(GroupRoom);
    const upNext = useRecoilValue(nextHolder);
    const base = typeof Window !== "undefined" ? window.location.protocol + '//' + window.location.host + '/room=' : '';
    const {
        connect: connectToSocket,
        connected,
        data,
        sendData,
        disconnect: disconnectFromSocket
    } = useContext(GroupWatchContext);
    const router = useRouter();

    useEffect(() => {
        if (join && connected && room !== '' && user)
            sendMessage({action: 'join'});

        if (user?.role === Role.GUEST && connected)
            disconnect();
    }, [room, connected, user, join])

    const copy = useCallback(async (room: string) => {
        navigator.clipboard.writeText(base + room)
            .then(() => {
                dispatch({
                    type: "alert",
                    heading: 'Copy Successful',
                    message: 'Video url copied successfully'
                })
            })
            .catch((error) => {
                dispatch({
                    type: "error",
                    heading: 'Something went wrong',
                    message: error as string
                })
            })
    }, [base])

    const connect = useCallback(() => {
        if (user?.role === Role.GUEST)
            dispatch({
                type: "error",
                heading: "Unauthorised action attempt",
                message: 'Guest accounts cannot create or join GroupWatch'
            })

        else if (!connected)
            connectToSocket();
    }, [user, connected])

    const sendMessage = useCallback((message: Message) => {
        if ((message.action === 'inform' && leader) || message.action !== 'inform')
            sendData({...message, userName: user?.email || '', watchRoom: room});
    }, [connected, sendData, user, leader, room])

    const updateRoom = useCallback(async (auth: string) => {
        if (leader && connected)
            await pFetch({auth, roomKey: room}, '/api/stream/groupWatch')
    }, [leader, connected])

    const pushNext = useCallback((data: string) => {
        if (leader && connected)
            sendMessage({action: "next", data})
    }, [leader, connected])

    const disconnect = useCallback(() => {
        setRoom('');
        sendMessage({action: "left"});
        setLeader(false);
        disconnectFromSocket();
    }, [sendMessage])

    const genRoom = useCallback(async (auth?: string) => {
        if (!connected) {
            const room = generateKey(3, 13);
            if (user?.role !== Role.GUEST) {
                await copy(room);
                if (auth) {
                    await pFetch({auth, roomKey: room}, '/api/stream/groupWatch');
                    await router.replace('/room=' + room, undefined, {shallow: true});
                }
            }

            setRoom(room);
            connect();
        } else {
            dispatch({
                type: "warn",
                heading: 'Left viewing session',
                message: 'You have left the GroupWatch session'
            })
            disconnect();
        }
    }, [connected])

    const sendNext = useCallback(() => {
        if (leader && upNext)
            sendMessage({action: 'nextHolder', upNext})
    }, [upNext, leader])

    return {
        connect,
        sendMessage,
        disconnect,
        updateRoom,
        message: data,
        sendNext,
        connected,
        setRoom,
        setLeader,
        pushNext,
        genRoom
    }
}