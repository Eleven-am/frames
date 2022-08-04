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
import {default_t, useBasics, useEventEmitter, usePreviousState} from "./customHooks";
import {Channel, Presence, Socket} from 'phoenix';
import useBase from "./provider";

const RealtimeContext = createContext<{ state: UseChannelInterface[], dispatch: Dispatch<{ info: 'socket' | 'connect' | 'disconnect' | 'connected', topic: string, params: default_t, socket: Socket }>, socket: any }>({
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
            state.forEach(s => s.channel.leave());
            action.socket.disconnect();
            return [];

        case 'connected':
            const connected = state.find(s => s.topic === action.topic);
            const filtered = state.filter(s => s.topic !== action.topic);
            if (connected)
                connected.connecting = false;

            return filtered.concat(connected ? [connected] : []);
    }
}

export const RealtimeConsumer = ({
                                     token,
                                     endpoint,
                                     children
                                 }: { token: string, endpoint: string, children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket>();
    const [state, dispatch] = useReducer(reducer, []);
    const previous = usePreviousState({endpoint, token});
    const {isMounted} = useBasics()

    useEffect(() => {
        if (token !== '' && isMounted()) {
            const socket = new Socket(endpoint, {params: {token}});
            socket.connect();
            setSocket(socket);
            return () => {
                if (previous && (previous.token !== token || previous.endpoint !== endpoint))
                    dispatch({info: 'socket', socket, topic: '', params: {}});
            }
        }
    }, [token, endpoint]);

    return (
        <RealtimeContext.Provider value={{socket, state, dispatch}}>
            {state.map(e => <ChannelComponent {...e} key={e.topic}/>)}
            {children}
        </RealtimeContext.Provider>
    );
}

const ChannelComponent = ({channel: chan, topic, connecting}: UseChannelInterface) => {
    const {isMounted} = useBasics();
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
            dispatch({info: 'connected', topic, params: {}, socket});
        });
    }, [topic, socket, dispatch, base, setOnJoin, setOnLeave, setOnUpdate, setReference, setOnConnection, setPreviousMessages]);

    const stopListeners = useCallback(() => {
        chan.off("inform");
    }, [chan]);

    useEffect(() => {
        if (chan && chan.state === 'closed' && connecting && isMounted())
            connectAndMaintainPresence(chan);
        return () => stopListeners();
    }, [chan]);

    return null;
}

export function useChannel<T extends { username: string, identifier: string }>(topic: string, params: T) {
    const {isMounted} = useBasics();
    const channel = useRef<Channel>();
    const {socket, state, dispatch} = useContext(RealtimeContext);
    const {subscribe: subscribeToOnJoin} = useEventEmitter<PresenceInterface>(`${topic}:join`);
    const {subscribe: subscribeToOnLeave} = useEventEmitter<PresenceInterface>(`${topic}:leave`);
    const {subscribe: subscribeToOnUpdate, state: online} = useEventEmitter<PresenceInterface[]>(`${topic}:update`);
    const {
        emit: setOnConnection,
        subscribe: subscribeToOnConnection,
        state: connected
    } = useEventEmitter<boolean>(`${topic}:connect`);
    const {state: reference} = useEventEmitter<RealtimeReference | null>(`${topic}:reference`);
    const {subscribe: subscribeToOnMessage} = useEventEmitter<EventInterface>(`${topic}:newMessage`);
    const messageHandlers = useRef<Map<string, ((data: default_t) => void)>>(new Map());
    const {
        state: previousMessages,
        subscribe: subscribeToPreviousMessages
    } = useEventEmitter<any>(`${topic}:previousMessages`);
    const toSend = useRef<Map<string, any>>(new Map());

    const connect = useCallback(() => {
        if (isMounted() && !connected) {
            dispatch({info: 'connect', topic, params, socket});
        }
    }, [topic, isMounted, params, socket]);

    const disconnect = useCallback(() => {
        setOnConnection(false);
        dispatch({info: 'disconnect', topic, params, socket});
    }, [setOnConnection, topic, params, socket]);

    function subscribe<S>(event: 'whisper' | 'shout' | 'response', callback: (data: S) => void) {
        messageHandlers.current.set(event, callback as any);
    }

    const unsubscribe = (event: string) => {
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

    const modifyPresenceState = useCallback((newState: string, metadata?: default_t) => {
        if (metadata)
            send('modPresenceState', {presenceState: newState, metadata});
        else
            send('modPresenceState', {presenceState: newState});
    }, [send]);

    const forceConnect = useCallback((topic: string, params: T) => {
        if (isMounted())
            dispatch({info: 'connect', topic, params, socket});
    }, [isMounted, dispatch]);

    const onJoin = (callback: (presence: PresenceInterface) => void) => subscribeToOnJoin(callback);

    const onLeave = (callback: (presence: PresenceInterface) => void) => subscribeToOnLeave(callback);

    const onUpdate = (callback: (presence: PresenceInterface[]) => void) => subscribeToOnUpdate(callback);

    const onConnectionChange = (callback: (connected: boolean) => void) => subscribeToOnConnection(callback);

    function onRecap<S>(callback: (messages: { messages: { content: S, recipient: string, sender: string }[] }) => void) {
        subscribeToPreviousMessages(callback);
    }

    useEffect(() => {
        const initChan = state.find(s => s.topic === topic);
        channel.current = initChan?.channel;
    }, [state, topic]);

    subscribeToOnMessage((data) => {
        const handler = messageHandlers.current.get(data.event);
        if (handler)
            handler(data.message);
    })

    return {
        modifyPresenceState, previousMessages, onRecap,
        onJoin, onLeave, connect, reference, hopChannels,
        disconnect, subscribe, unsubscribe, send, whisper,
        onUpdate, transport: channel.current, forceConnect,
        connected, onConnectionChange, online: online || []
    };
}