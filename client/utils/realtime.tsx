import React, {createContext, ReactNode, useEffect, useReducer, useRef} from "react";
import {useBasics, useEventEmitter, usePreviousState} from "./customHooks";
import {Channel, Presence, Socket} from 'phoenix';

const RealtimeContext = createContext<{ state: UseChannelInterface[], dispatch: React.Dispatch<{ info: 'socket' | 'connect' | 'disconnect' | 'connected', topic: string, params: default_t, socket: Socket }>, socket: any }>({
    state: [],
    dispatch: () => {
    },
    socket: null
});

export interface PresenceInterface {
    username: string;
    online_at: string;
    reference: string;
    presenceState: string;
    phx_ref: string;
    phx_ref_prev?: string;
}

type default_t = {
    [p: string]: any
}

type RealtimeReference = { message: string, username: string, reference: string };

interface UseChannelInterface {
    topic: string;
    channel: Channel;
    connecting: boolean;
}

function reducer(state: UseChannelInterface[], action: { info: 'socket' | 'connected' | 'connect' | 'disconnect', topic: string, params: default_t, socket: Socket }): UseChannelInterface[] {
    switch (action.info) {
        case 'connect':
            const sock = state.find(s => s.topic === action.topic);
            if (sock || !action.socket)
                return state;

            const channel = action.socket.channel(action.topic, action.params);
            return [...state, {topic: action.topic, channel, connecting: true}];

        case 'disconnect':
            const disconnect = state.find(s => s.topic === action.topic);
            const newState = state.filter(s => s.topic !== action.topic);
            if (disconnect)
                disconnect.channel.leave();

            return newState;

        case 'socket':
            state.forEach(s => {
                s.channel.leave();
            });
            action.socket.disconnect();
            return [];

        case 'connected':
            const connected = state.find(s => s.topic === action.topic);
            const filtered = state.filter(s => s.topic !== action.topic);
            if (connected) {
                connected.connecting = false;
            }

            return filtered.concat(connected ? [connected] : []);
    }
}

export const RealtimeConsumer = ({apiKey, children}: { apiKey: string, children: ReactNode }) => {
    const [socket, setSocket] = React.useState<Socket>();
    const [state, dispatch] = useReducer(reducer, []);
    const {isMounted} = useBasics()

    useEffect(() => {
        if (apiKey !== '' && isMounted()) {
            const socket = new Socket("wss://real-time.maix.ovh/socket", {params: {apiKey}});
            socket.connect();
            setSocket(socket);
            return () => {
                dispatch({info: 'socket', socket, params: {}, topic: ''});
            };
        }
    }, [apiKey]);

    return (
        <RealtimeContext.Provider value={{socket, state, dispatch}}>
            {state.map(e => <ChannelComponent {...e} key={e.topic}/>)}
            {children}
        </RealtimeContext.Provider>
    );
}

const ChannelComponent = ({channel: chan, topic, connecting}: UseChannelInterface) => {
    const {isMounted} = useBasics();
    const {socket, dispatch} = React.useContext(RealtimeContext);
    const presence = React.useRef<Presence>();
    const {emit: setOnJoin} = useEventEmitter<PresenceInterface>(`${topic}:join`);
    const {emit: setOnLeave} = useEventEmitter<PresenceInterface>(`${topic}:leave`);
    const {emit: setOnUpdate} = useEventEmitter<PresenceInterface[]>(`${topic}:update`);
    const {emit: setReference} = useEventEmitter<RealtimeReference | null>(`${topic}:reference`);
    const {emit: setOnConnection} = useEventEmitter<boolean>(`${topic}:connect`);

    const connectAndMaintainPresence = (chan: any) => {
        presence.current = new Presence(chan);

        presence.current.onJoin((id, current, newPresence) => {
            if (!current)
                setOnJoin(newPresence.metas[0]);
        });

        presence.current.onLeave((id, current, leftPress) => {
            if (current.metas.length === 0)
                setOnLeave(leftPress.metas[0]);
        });

        presence.current.onSync(() => {
            const presences: any[] = presence.current?.list() ?? [];
            const users = presences.map(e => e.metas[0]);
            setOnUpdate(users);
        });

        chan.join().receive('ok', () => {
            chan.on('inform', (msg: any) => {
                setReference(msg);
            });

            setOnConnection(true);
            dispatch({info: 'connected', topic, params: {}, socket});
        });
    }

    const stopListeners = () => {
        chan.off("inform");
    }

    useEffect(() => {
        if (chan && chan.state === 'closed' && connecting && isMounted())
            connectAndMaintainPresence(chan);
        return () => stopListeners();
    }, [chan]);

    return null;
}

export function useChannel<T extends { username: string }>(topic: string, params: T) {
    const {isMounted} = useBasics();
    const channel = useRef<Channel>();
    const prevTopic = usePreviousState(topic);
    const {socket, state, dispatch} = React.useContext(RealtimeContext);
    const {subscribe: subscribeToOnJoin} = useEventEmitter<PresenceInterface>(`${topic}:join`);
    const {subscribe: subscribeToOnLeave} = useEventEmitter<PresenceInterface>(`${topic}:leave`);
    const {subscribe: subscribeToOnUpdate, state: online} = useEventEmitter<PresenceInterface[]>(`${topic}:update`);
    const {emit: setOnConnection, subscribe: subscribeToOnConnection, state: connected} = useEventEmitter<boolean>(`${topic}:connect`);
    const {state: reference} = useEventEmitter<RealtimeReference | null>(`${topic}:reference`);
    const messageHandlers = useRef<Map<string, ((data: default_t) => void)>>(new Map());
    const toSend = useRef<Map<string, any>>(new Map());

    const connect = () => {
        if (topic !== prevTopic && topic !== '' && isMounted())
            dispatch({info: 'connect', topic, params, socket});
    }

    const disconnect = () => {
        setOnConnection(false);
        dispatch({info: 'disconnect', topic, params, socket});
    }

    function subscribe<S>(event: 'whisper' | 'shout' | 'response', callback: (data: S) => void) {
        if (channel.current) {
            channel.current.off(event);
            channel.current.on(event, callback);

        } else
            messageHandlers.current.set(event, callback as any);
    }

    const unsubscribe = (event: string) => {
        if (channel.current)
            channel.current.off(event);

        messageHandlers.current.delete(event);
    }

    function send<S extends default_t>(event: 'whisper' | 'speak' | 'shout' | 'request' | 'modPresenceState', data: S) {
        if (channel.current)
            channel.current.push(event, data);

        else
            toSend.current.set(event, data);
    }

    function whisper<S>(to: string, data: S) {
        send('whisper', {to, message: data});
    }

    function hopChannels<S>(channel: string, message: S & { username: string }) {
        const chan = socket.channel(channel, {username: message.username})
        chan.join().receive('ok', () => {
            let nMsg: S & { username?: string } = {...message};
            delete nMsg.username;
            chan.push('shout', message);
            chan.leave();
        });
    }

    const modifyPresenceState = (newState: string) => {
        send('modPresenceState', {presenceState: newState});
    }

    const forceConnect = (topic: string, params: T) => {
        if (isMounted())
            dispatch({info: 'connect', topic, params, socket});
    }

    const onJoin = (callback: (presence: PresenceInterface) => void) => subscribeToOnJoin(callback);

    const onLeave = (callback: (presence: PresenceInterface) => void) => subscribeToOnLeave(callback);

    const onUpdate = (callback: (presence: PresenceInterface[]) => void) => subscribeToOnUpdate(callback);

    const onConnectionChange = (callback: (connected: boolean) => void) => subscribeToOnConnection(callback);

    useEffect(() => {
        const initChan = state.find(s => s.topic === topic);
        channel.current = initChan?.channel;
    }, [state, topic]);

    useEffect(() => {
        if (channel.current) {
            const chan = channel.current;

            chan.onMessage = (event, data) => {
                const handler = messageHandlers.current.get(event);
                if (handler && isMounted())
                    handler(data);
                return data;
            }
        }
    }, [channel.current])

    return {
        modifyPresenceState,
        connected, onConnectionChange, online: online || [],
        onJoin, onLeave, connect, reference, hopChannels,
        disconnect, subscribe, unsubscribe, send, whisper,
        onUpdate, transport: channel.current, forceConnect
    };
}