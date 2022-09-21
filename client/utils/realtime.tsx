import {createContext, memo, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {Channel, Presence, Socket} from "phoenix";
import {default_t, useBasics} from "./customHooks";
import useBase from "./provider";
import {BehaviorSubject, Subject} from "rxjs";

export interface PresenceInterface<T = any> {
    username: string;
    online_at: string;
    reference: string;
    presenceState: string;
    identifier: string;
    phx_ref: string;
    phx_ref_prev?: string;
    metadata: default_t<T>;
}

type RealtimeReference = { message: string, username: string, reference: string };

type RealtimeChannel = {
    channel: Channel,
    presence: Presence,
    users: BehaviorSubject<PresenceInterface[]>
    reference: BehaviorSubject<RealtimeReference | undefined>
    joined: Subject<PresenceInterface>
    left: Subject<PresenceInterface>
    message: Subject<{event: string, data: any}>
}

interface RealtimeContextProps {
    channels: Map<string, RealtimeChannel>;
    socket: Socket | null;
    connect: (topic: string, params: default_t) => void;
    disconnect: (topic: string) => void;
}

const RealTimeContext = createContext<RealtimeContextProps>({
    channels: new Map(),
    socket: null,
    connect: () => {},
    disconnect: () => {}
});

interface RealtimeProps {
    children: ReactNode;
    token: string;
    endpoint: string;
    onConnect?: (socket: Socket) => void;
    onDisconnect?: (socket: Socket) => void;
    onError?: (error: Error) => void;
}

export const RealtimeConsumer = memo(({children, token, endpoint, onError, onConnect, onDisconnect}: RealtimeProps) => {
    const base = useBase();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map());

    const handleSync = useCallback((presence: Presence) => {
        const presences: { metas: PresenceInterface<any>[] }[] = presence.list() ?? [];
        return presences.map(e => base.sortArray(e.metas, 'online_at', 'desc')[0]);
    }, [base]);

    const connect = useCallback((topic: string, params: default_t) => {
        if (socket) {
            const channel = socket.channel(topic, params);
            const presence = new Presence(channel);
            const joined = new Subject<PresenceInterface>();
            const left = new Subject<PresenceInterface>();
            const users = new BehaviorSubject<PresenceInterface[]>([]);
            const message = new Subject<{event: string, data: any}>();
            const reference = new BehaviorSubject<RealtimeReference | undefined>(undefined);

            presence.onJoin((id, current, newPresence) => {
                if (!current)
                    joined.next(newPresence.metas[0]);
            });

            presence.onLeave((id, current, leftPress) => {
                if (current.metas.length === 0)
                    left.next(leftPress.metas[0]);
            });

            presence.onSync(() => {
                const presences = handleSync(presence);
                users.next(presences);
            });

            channel.onMessage = (event, data) => {
                if (event === 'inform')
                    reference.next(data);

                else
                    message.next({event, data});

                return data;
            };

            setChannels(channels => new Map(channels.set(topic, {channel, presence, reference, joined, left, users, message})));
            channel.join()
                .receive("ok", () => {
                    const presences = handleSync(presence);
                    users.next(presences);
                });

            channel.onClose(() => {
                users.next([]);
                reference.next(undefined);
            });
        }
    }, [socket]);

    const disconnect = useCallback((topic: string) => {
        if (socket) {
            const channel = channels.get(topic)?.channel;
            if (channel) {
                channel.leave();
                const tempChannels = new Map(channels);
                tempChannels.delete(topic);
                setChannels(tempChannels);
            }
        }
    }, [socket, channels]);

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
        <RealTimeContext.Provider value={{socket, channels, connect, disconnect}}>
            {children}
        </RealTimeContext.Provider>
    )
})

export const useChannel = (channelName: string, options: { username: string, identifier: string }) => {
    const {isMounted} = useBasics();
    const {socket, connect: open, disconnect: close, channels} = useContext(RealTimeContext);
    const messageHandlers = useRef<Map<string, ((data: any) => void)>>(new Map());
    const [reference, setReference] = useState<RealtimeReference | undefined>(undefined);
    const [online, setOnline] = useState<PresenceInterface[]>([]);
    const [previousMessages, setPreviousMessages] = useState<any[]>([]);

    const channel = useMemo(() => {
        return channels.get(channelName) || null;
    }, [channels, channelName]);

    const connected = useMemo(() => {
        return channel?.channel.state === 'joined';
    }, [channel?.channel?.state]);

    const users = useMemo(() => {
        return online.filter(e => e.identifier !== options.identifier);
    }, [online, options.identifier]);

    const onConnectionChange = useCallback((handler: (connected: boolean) => void) => {
        messageHandlers.current.set('connection', handler);
    }, []);

    const connect = useCallback(() => {
        open(channelName, options);
    }, [channelName, options, open]);

    const disconnect = useCallback(() => {
        close(channelName);
    }, [channelName, close]);

    const send = useCallback(<S extends object>(event: string, data: S) => {
        if (channel && channel.channel.state === 'joined')
            channel.channel.push(event, data);
    }, [channel]);

    const whisper = useCallback(<S extends object>(username: string, data: S) => {
        send('whisper', {to: username, message: data});
    }, [send]);

    const hopChannels = useCallback((channelName: string, options: { username: string, identifier: string }, message: default_t) => {
        const chan = socket?.channel(channelName, options)
        if (chan) {
            chan.join().receive('ok', () => {
                let nMsg: default_t = {...message};
                delete nMsg.username;
                chan.push('shout', message);
                chan.leave();
            });
        }
    }, [socket]);

    const modifyPresenceState = useCallback(<S extends object>(newState: string, metadata?: S) => {
        if (metadata)
            send('modPresenceState', {presenceState: newState, metadata});
        else
            send('modPresenceState', {presenceState: newState});
    }, [send]);

    const on = useCallback(<S extends any>(event: string, handler: (data: S) => void) => {
        messageHandlers.current.set(event, handler);
    }, []);

    const off = useCallback((event: string) => {
        messageHandlers.current.delete(event);
    }, []);

    const onJoin = useCallback(<S extends any>(handler: (data: PresenceInterface<S>) => void) => {
        messageHandlers.current.set('onJoin', handler);
    }, []);

    const onLeave = useCallback(<S extends any>(handler: (data: PresenceInterface<S>) => void) => {
        messageHandlers.current.set('onLeave', handler);
    }, []);

    const onRecap = useCallback(<S extends any>(handler: (data: PresenceInterface<S>[]) => void) => {
        messageHandlers.current.set('onRecap', handler);
    }, []);

    const onUpdate = useCallback(<S extends any>(handler: (data: PresenceInterface<S>[]) => void) => {
        messageHandlers.current.set('onSync', handler);
    }, []);

    const subscribe = useCallback(() => {
        if (channel) {
            const joined = channel.joined.subscribe(e => {
                if (isMounted() && e.identifier !== options.identifier) {
                    const handler = messageHandlers.current.get('onJoin');
                    handler && handler(e);
                }
            });

            const left = channel.left.subscribe(e => {
                if (isMounted() && e.identifier !== options.identifier) {
                    const handler = messageHandlers.current.get('onLeave');
                    handler && handler(e);
                }
            });

            const users = channel.users.subscribe(e => {
                if (isMounted()) {
                    const handler = messageHandlers.current.get('onSync');
                    handler && handler(e.filter(e => e.identifier !== options.identifier));
                    setOnline(e);
                }
            });

            const reference = channel.reference.subscribe(e => {
                if (isMounted()) {
                    setReference(e);
                }
            });

            const message = channel.message.subscribe(e => {
                if (isMounted()) {
                    if (e.event === 'messages') {
                        setPreviousMessages(e.data);
                        const handler = messageHandlers.current.get('onRecap');
                        handler && handler(e.data);
                    }

                    const handler = messageHandlers.current.get(e.event);
                    handler && handler(e.data);
                }
            });

            return () => {
                joined.unsubscribe();
                left.unsubscribe();
                users.unsubscribe();
                reference.unsubscribe();
                message.unsubscribe();
            }
        } return () => {};
    } , [channel, isMounted, options.identifier]);

    useEffect(() => {
        const subscription = subscribe();
        return () => subscription();
    }, [channel]);

    useEffect(() => {
        if (connected) {
            const handler = messageHandlers.current.get('connection');
            handler && handler(true);
        } else {
            const handler = messageHandlers.current.get('connection');
            handler && handler(false);
        }
    }, [connected]);

    return {
        connected, users, onConnectionChange,
        modifyPresenceState, previousMessages, onRecap,
        onJoin, onLeave, connect, reference, hopChannels,
        onUpdate, transport: channel?.channel, forceConnect: open,
        disconnect, subscribe: on, unsubscribe: off, send, whisper,
    }
}
