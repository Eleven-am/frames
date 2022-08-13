import {
    createContext,
    Dispatch,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
    useRef,
    useState
} from "react";
import {default_t, useEventEmitter} from "./customHooks";
import {Channel, Presence, Socket} from 'phoenix';
import useBase from "./provider";

const RealtimeContext = createContext<{ state: UseChannelInterface[], dispatch: Dispatch<{ info: 'connect' | 'disconnect', topic: string, params: default_t, socket: Socket }>, socket: any }>({
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
    identifier: string;
    phx_ref: string;
    phx_ref_prev?: string;
    metadata: default_t;
}

type RealtimeReference = { message: string, username: string, reference: string };

interface UseChannelInterface {
    topic: string;
    channel: Channel;
    connecting: boolean;
}

interface EventInterface {
    event: 'whisper' | 'shout' | 'response';
    message: any
}

export interface PrevMessages<S> {
    messages: { content: S, recipient: string, sender: string }[]
}

function reducer(state: UseChannelInterface[], action: { info: 'connect' | 'disconnect', topic: string, params: default_t, socket: Socket }): UseChannelInterface[] {
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
    }
}

interface RealtimeProps {
    children: ReactNode;
    token: string;
    endpoint: string;
    onConnect?: (socket: Socket) => void;
    onDisconnect?: (socket: Socket) => void;
    onError?: (error: any) => void;
}

export const RealtimeConsumer = ({token, endpoint, children, onError, onConnect, onDisconnect}: RealtimeProps) => {
    const [socket, setSocket] = useState<Socket>();
    const [state, dispatch] = useReducer(reducer, []);

    const generateSocket = useCallback(() => {
        if (token !== '' && endpoint !== '') {
            const socket = new Socket(endpoint, {params: {token}});
            socket.connect();
            setSocket(socket);

            socket.onError(async error => {
                if (onError)
                    onError(error);
            });

            socket.onOpen(async () => {
                if (onConnect)
                    onConnect(socket);
            })

            socket.onClose(async () => {
                if (onDisconnect)
                    onDisconnect(socket);
            });

            return socket;
        }

        return null;
    }, [token, endpoint, onError, onConnect, onDisconnect]);

    const destroySocket = useCallback((socket: Socket | null) => {
        socket?.disconnect();
    }, []);

    useEffect(() => {
        const socket = generateSocket();
        return () => destroySocket(socket);
    }, [endpoint, token]);

    return (
        <RealtimeContext.Provider value={{socket, state, dispatch}}>
            {state.map(e => <ChannelComponent {...e} key={e.topic}/>)}
            {children}
        </RealtimeContext.Provider>
    );
}

const ChannelComponent = ({channel: chan, topic, connecting}: UseChannelInterface) => {
    const base = useBase();
    const {socket, dispatch} = useContext(RealtimeContext);
    const presence = useRef<Presence>();
    const {emit: setOnJoin} = useEventEmitter<PresenceInterface>(`${topic}:join`);
    const {emit: setOnLeave} = useEventEmitter<PresenceInterface>(`${topic}:leave`);
    const {emit: setOnUpdate} = useEventEmitter<PresenceInterface[]>(`${topic}:update`);
    const {emit: setReference} = useEventEmitter<RealtimeReference | null>(`${topic}:reference`);
    const {emit: setOnConnection} = useEventEmitter<boolean>(`${topic}:connect`);
    const {emit: setOnMessage} = useEventEmitter<EventInterface>(`${topic}:newMessage`);
    const {emit: setPreviousMessages} = useEventEmitter<any>(`${topic}:previousMessages`);

    const connectAndMaintainPresence = useCallback((chan: Channel) => {
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
            const presences: { metas: PresenceInterface[] }[] = presence.current?.list() ?? [];
            const users = presences.map(e => base.sortArray(e.metas, 'online_at', 'desc')[0]);
            setOnUpdate(users);
        });

        chan.join().receive('ok', () => {
            chan.onMessage = (event, message) => {
                if (event === 'shout' || event === 'whisper' || event === 'response')
                    setOnMessage({event, message});

                else if (event === 'messages')
                    setPreviousMessages(message);

                else if (event === 'inform')
                    setReference(message);

                return message;
            }

            setOnConnection(true);
        });
    }, [topic, socket, dispatch, base, setOnJoin, setOnLeave, setOnUpdate, setReference, setOnConnection, setPreviousMessages]);

    useEffect(() => {
        if (chan && chan.state === 'closed' && connecting)
            connectAndMaintainPresence(chan);
    }, [chan]);

    return null;
}

export function useChannel<T extends { username: string, identifier: string }>(topic: string, params: T) {
    const channel = useRef<Channel>();
    const toSend = useRef<Map<string, any>>(new Map());
    const {socket, state, dispatch} = useContext(RealtimeContext);
    const messageHandlers = useRef<Map<string, ((data: default_t) => void)>>(new Map());
    const {state: reference} = useEventEmitter<RealtimeReference | null>(`${topic}:reference`);
    const {subscribe: subscribeToOnJoin} = useEventEmitter<PresenceInterface>(`${topic}:join`);
    const {subscribe: subscribeToOnLeave} = useEventEmitter<PresenceInterface>(`${topic}:leave`);
    const {subscribe: subscribeToOnMessage} = useEventEmitter<EventInterface>(`${topic}:newMessage`);
    const {
        subscribe: subscribeToOnUpdate,
        state: online,
        emit: dispatchOnline
    } = useEventEmitter<PresenceInterface[]>(`${topic}:update`);
    const {
        emit: setOnConnection,
        subscribe: subscribeToOnConnection,
        state: connected
    } = useEventEmitter<boolean>(`${topic}:connect`);
    const {
        state: previousMessages,
        subscribe: subscribeToPreviousMessages,
        emit: setPreviousMessages
    } = useEventEmitter<any>(`${topic}:previousMessages`);

    const connect = useCallback(() => {
        if (!connected) {
            dispatch({info: 'connect', topic, params, socket});
        }
    }, [connected, dispatch, params, socket, topic]);

    const disconnect = useCallback(() => {
        dispatchOnline([]);
        setOnConnection(false);
        setPreviousMessages([]);
        dispatch({info: 'disconnect', topic, params, socket});
    }, [topic, params, socket, dispatchOnline, setOnConnection, setPreviousMessages]);

    const subscribe = useCallback(<S extends unknown>(event: 'whisper' | 'shout' | 'response', callback: (data: S) => void) => {
        messageHandlers.current.set(event, callback as any);
    }, []);

    const unsubscribe = useCallback((event: 'whisper' | 'shout' | 'response') => {
        messageHandlers.current.delete(event);
    }, []);

    const send = useCallback(<S extends object>(event: 'whisper' | 'speak' | 'shout' | 'request' | 'modPresenceState', data: S) => {
        if (channel.current)
            channel.current.push(event, data);
        else
            toSend.current.set(event, data);
    }, []);

    const whisper = useCallback(<S extends object>(to: string, data: any) => {
        send('whisper', {to, message: data});
    }, [send]);

    const hopChannels = useCallback(<S extends object>(channel: string, message: S & { username: string }) => {
        const chan = socket.channel(channel, {username: message.username})
        chan.join().receive('ok', () => {
            let nMsg: S & { username?: string } = {...message};
            delete nMsg.username;
            chan.push('shout', message);
            chan.leave();
        });
    }, [socket]);

    const modifyPresenceState = useCallback((newState: string, metadata?: default_t) => {
        if (metadata)
            send('modPresenceState', {presenceState: newState, metadata});
        else
            send('modPresenceState', {presenceState: newState});
    }, [send]);

    const forceConnect = useCallback((topic: string, params: T) => {
        dispatch({info: 'connect', topic, params, socket});
    }, [socket, dispatch]);

    const onJoin = useCallback((callback: (presence: PresenceInterface) => void) => subscribeToOnJoin(callback), [subscribeToOnJoin]);

    const onLeave = useCallback((callback: (presence: PresenceInterface) => void) => subscribeToOnLeave(callback), [subscribeToOnLeave]);

    const onUpdate = useCallback((callback: (presence: PresenceInterface[]) => void) => subscribeToOnUpdate(callback), [subscribeToOnUpdate]);

    const onConnectionChange = useCallback((callback: (connected: boolean) => void) => subscribeToOnConnection(callback), [subscribeToOnConnection]);

    const onRecap = useCallback(<S extends object>(callback: (event: PrevMessages<S>) => void) => subscribeToPreviousMessages(callback), [subscribeToOnMessage]);

    useEffect(() => {
        const initChan = state.find(s => s.topic === topic);
        channel.current = initChan?.channel;
    }, [state, topic]);

    subscribeToOnMessage((data) => {
        const handler = messageHandlers.current.get(data.event);
        if (handler)
            handler(data.message);
    });

    return {
        modifyPresenceState, previousMessages, onRecap,
        onJoin, onLeave, connect, reference, hopChannels,
        disconnect, subscribe, unsubscribe, send, whisper,
        onUpdate, transport: channel.current, forceConnect,
        connected, onConnectionChange, online: online || []
    };
}
