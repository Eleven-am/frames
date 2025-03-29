import { ClientUserSchema, MetadataSchema, Role } from '@/api/data-contracts';
import { ApiEventProvider } from '@/providers/apiProvider';
import { userStore } from '@/providers/userProvider';
import { dedupeBy } from '@/utils/arrayFunctions';
import { sortBy } from '@eleven-am/fp';
import { EventNotifier, getSnapshot } from '@eleven-am/notifier';
import type { Observer, Unsubscribe } from '@eleven-am/notifier/types';
import PondClient, { ChannelState } from '@eleven-am/pondsocket-client';
import type { Channel } from '@eleven-am/pondsocket-client/dist';
import { JoinParams, PondEventMap } from '@eleven-am/pondsocket-common';

export interface PresenceInterface {
    username: string;
    status: string;
    channel: string;
    browserId: string;
    isIncognito: boolean;
    metadata: MetadataSchema | null;
    onlineAt: number;
}

interface InternalState {
    users: PresenceInterface[];
    channel: string | null;
    error: string | null;
    connected: boolean;
}

type RealtimeState<Extension extends object> = InternalState & Extension;

type MessageEvent<MessageType extends PondEventMap> = {
    [Event in keyof MessageType]: MessageType[Event];
};

type EventState<MessageType extends PondEventMap> = {
    join: PresenceInterface;
    leave: PresenceInterface;
    presence: PresenceInterface;
    message: {event: keyof MessageType, data: MessageType[keyof MessageType]};
} & MessageEvent<MessageType>;

interface ConnectionState {
    onOpen: PondClient;
}

class FramesSocket extends EventNotifier<null, ConnectionState> {
    #socket: PondClient | null;

    constructor () {
        super(null);
        this.#socket = null;
    }

    public connect (endpoint: string): Unsubscribe {
        const socket = new PondClient(endpoint);

        this.#socket = socket;
        this.emit('onOpen', socket);

        socket.connect();

        return () => this.disconnect();
    }

    public onOpen (observer: Observer<PondClient>): Unsubscribe {
        if (this.#socket) {
            observer(this.#socket);
        }

        return this.on('onOpen', observer);
    }

    public disconnect (): void {
        this.#socket?.disconnect();
        this.#socket = null;
    }
}

const framesSocket = new FramesSocket();

export const useFramesSocketActions = framesSocket.createActionsHook();

export class FramesChannel<Extension extends object = object, MessageType extends PondEventMap = PondEventMap> extends ApiEventProvider<RealtimeState<Extension>, EventState<MessageType>> {
    #channel: Channel<MessageType, PresenceInterface> | null;

    #channelName: string | null;

    #unsubscribe: Unsubscribe | null;

    constructor (extension: Extension) {
        super({
            ...extension,
            connected: false,
            messages: [],
            users: [],
            error: null,
            channel: null,
        });

        this.#channelName = null;
        this.#unsubscribe = null;
        this.#channel = null;
    }

    protected get user (): ClientUserSchema | null {
        return getSnapshot(userStore).session;
    }

    protected leave (): void {
        this.#unsubscribe?.();
        this.#channel?.leave();
        this.#channel = null;
    }

    protected join (topic: string, params?: JoinParams): Unsubscribe {
        this.#unsubscribe = framesSocket.onOpen((socket) => {
            if (!this.user) {
                this.setError('Not logged in');

                return;
            }

            this.#init(socket, topic, params);
        });

        return () => this.leave();
    }

    protected setError (error: string): void {
        this.#setInternalState({
            error,
        });
    }

    protected sendMessage<Event extends keyof MessageType> (event: Event, data: MessageType[Event]): void {
        if (this.#channel) {
            this.#channel.sendMessage(event, data);
        }
    }

    protected updateExtension (extension: Partial<Extension>): void {
        this.updateState({
            ...this.state,
            ...extension,
        });
    }

    #isInCognito (user: PresenceInterface): boolean {
        return user.isIncognito && this.user?.role !== Role.ADMIN;
    }

    #canPush () {
        return this.#channel?.channelState === ChannelState.STALLED || this.#channel?.channelState === ChannelState.JOINED;
    }

    #init (socket: PondClient, topic: string, params?: JoinParams): void {
        if (this.#canPush() && this.#channelName === topic) {
            this.#setInternalState({
                error: 'Already connected',
            });

            return;
        }

        this.leave();
        this.#channelName = topic;
        this.#setInternalState({
            error: null,
            channel: topic,
        });

        const channel = socket.createChannel<MessageType, PresenceInterface>(topic, params);

        channel.onJoin((presence) => {
            this.emit('join', presence as any);
        });

        channel.onLeave((presence) => {
            this.emit('leave', presence as any);
        });

        channel.onPresenceChange((presence) => {
            this.emit('presence', presence.changed as any);
        });

        channel.onUsersChange((presence) => {
            const filteredUsers = presence.filter((user) => user.browserId !== this.user?.browserId && user.username !== this.user?.username)
                .filter((user) => !this.#isInCognito(user));

            this.#setInternalState({
                users: dedupeBy(sortBy(filteredUsers, 'onlineAt', 'desc'), 'username'),
            });
        });

        channel.onMessage((event, data) => {
            this.emit(event, data as any);
        });

        channel.onChannelStateChange((state) => {
            const connected = state === ChannelState.JOINED;

            this.#setInternalState({
                connected,
            });
        });

        channel.join();
        this.#channel = channel;
    }

    #setInternalState (newState: Partial<InternalState>): void {
        this.updateState({
            ...this.state,
            ...newState,
        });
    }
}
