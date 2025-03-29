import { hasError } from '@eleven-am/fp';

import { RoomResponseSchema, UpNextDetailsSchema, PlaybackSessionSchema } from '@/api/data-contracts';
import { navigate } from '@/hooks/useClientAction';
import { FramesChannel, PresenceInterface } from '@/providers/realtimeNotifier';

interface Message {
    message: string;
    username: string;
    time: number;
    self: boolean;
}

interface GroupWatchState {
    roomData: RoomResponseSchema | null;
    messageHistory: Message[];
    creatingSession: boolean;
    isModalOpen: boolean;
    isChatOpen: boolean;
}

export type RoomEventMap = {
    noResponse: object;
    invite: { browserId: string };
    evict: { browserId: string };
    evicted: object;
    playState: {
        time: number;
        isPaused: boolean;
        username: string;
        browserId: string;
    };
    bufferState: {
        time: number;
        buffering: boolean;
        username: string;
        browserId: string;
    };
    seeked: {
        username: string;
        time: number;
    };
    next: {
        data: UpNextDetailsSchema;
    };
    message: {
        text: string;
        username: string;
        browserId: string;
    };
    requestSync: object;
    sync: {
        time: number;
    };
    promote: object;
    startSession: {
        time: number;
    };
}

class GroupWatch extends FramesChannel<GroupWatchState, RoomEventMap> {
    constructor () {
        super({
            roomData: null,
            isModalOpen: false,
            creatingSession: false,
            isChatOpen: false,
            messageHistory: [],
        });

        this.on('promote', () => {
            this.updateState({
                creatingSession: true,
            });
        });

        this.on('playState', (data) => {
            this.#addMessage({
                message: `${data.username} has ${data.isPaused ? 'paused' : 'played'} at ${data.time.toFixed(2)}`,
                username: data.username,
                time: Date.now(),
                self: false,
            });
        });

        this.on('bufferState', (data) => {
            this.#addMessage({
                message: `${data.username} is ${data.buffering ? 'buffering' : 'not buffering'} at ${data.time.toFixed(2)}`,
                username: data.username,
                time: Date.now(),
                self: false,
            });
        });

        this.on('seeked', (data) => {
            this.#addMessage({
                message: `${data.username} has seeked to ${data.time.toFixed(2)}`,
                username: data.username,
                time: Date.now(),
                self: false,
            });
        });

        this.on('message', (data) => {
            this.#addMessage({
                message: data.text,
                username: data.username,
                time: Date.now(),
                self: false,
            });
        });
    }

    async createRoomFromMedia (mediaId: string) {
        if (this.state.connected) {
            this.updateState({
                isModalOpen: true,
            });

            return;
        }

        const response = await this.apiAction((client) => client.roomsControllerCreateRoomForMedia(mediaId));

        if (hasError(response)) {
            return;
        }

        await navigate({
            to: '/rooms/$roomId',
            params: {
                roomId: response.data.roomId,
            },
            mask: {
                to: `/r=${response.data.roomId}` as string,
            },
        });

        return response.data.roomId;
    }

    async createRoomFromPlayback (playbackId: string) {
        if (this.state.connected) {
            this.updateState({
                isModalOpen: true,
            });

            return;
        }

        const response = await this.apiAction((client) => client.roomsControllerCreateRoomForPlayback(playbackId));

        if (hasError(response)) {
            return;
        }

        await navigate({
            to: '/rooms/$roomId',
            params: {
                roomId: response.data.roomId,
            },
            mask: {
                to: `/r=${response.data.roomId}` as string,
            },
        });

        return response.data.roomId;
    }

    closeModal () {
        this.updateExtension({
            isModalOpen: false,
        });
    }

    endSession () {
        this.leave();
        this.updateExtension({
            roomData: null,
            isModalOpen: false,
            isChatOpen: false,
            messageHistory: [],
        });
    }

    inviteUser (item: PresenceInterface) {
        this.sendMessage('invite', {
            browserId: item.browserId,
        });

        this.#addMessage({
            message: `You have invited ${item.username} to join the room`,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    evictUser (item: PresenceInterface) {
        this.sendMessage('evict', {
            browserId: item.browserId,
        });

        this.#addMessage({
            message: `You have evicted ${item.username} from the room`,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    joinRoom (roomId: string, playbackSession: PlaybackSessionSchema | null) {
        const latestLocationPathname = window.tsRouter.latestLocation.pathname;

        if (!playbackSession || this.state.roomData?.roomId === roomId || latestLocationPathname !== `/rooms/${roomId}`) {
            return;
        }

        this.updateState({
            isModalOpen: true,
            roomData: {
                roomId,
                isLeader: false,
                mediaName: playbackSession.name,
                episodeName: playbackSession.episodeName,
                playbackId: playbackSession.playbackId,
                backdrop: playbackSession.backdrop,
                backdropBlur: playbackSession.backdropBlur,
                episodeId: playbackSession.episodeId,
                logo: playbackSession.logo,
                logoBlur: playbackSession.logoBlur,
                mediaId: playbackSession.mediaId,
                mediaType: playbackSession.mediaType,
                poster: playbackSession.poster,
                videoId: playbackSession.videoId,
            },
        });

        this.join(`/rooms/${roomId}`, {
            playbackId: playbackSession.playbackId,
        });
    }

    requestSync () {
        this.sendMessage('requestSync', {
        });
    }

    sendPlayState (time: number, isPaused: boolean) {
        this.sendMessage('playState', {
            time,
            isPaused,
            username: this.user?.username ?? '',
            browserId: this.user?.browserId ?? '',
        });

        this.#addMessage({
            message: `You have ${isPaused ? 'paused' : 'played'} at ${time.toFixed(2)}`,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    sendSeeked (time: number) {
        this.sendMessage('seeked', {
            time,
            username: this.user?.username ?? '',
        });

        this.#addMessage({
            message: `You have seeked to ${time.toFixed(2)}`,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    sendSync (time: number) {
        if (!this.state.roomData?.isLeader) {
            return;
        }

        this.sendMessage('sync', {
            time,
        });
    }

    startSession () {
        this.updateState({
            isModalOpen: false,
        });
    }

    sendStartSession (time: number) {
        this.sendMessage('startSession', {
            time,
        });
        this.startSession();
    }

    sendBufferState (time: number, buffering: boolean) {
        this.sendMessage('bufferState', {
            time,
            buffering,
            username: this.user?.username ?? '',
            browserId: this.user?.browserId ?? '',
        });

        this.#addMessage({
            message: `You are ${buffering ? 'buffering' : 'not buffering'} at ${time.toFixed(2)}`,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    toggleChat () {
        this.updateState({
            isChatOpen: !this.state.isChatOpen,
        });
    }

    isConnected () {
        return this.state.connected;
    }

    broadcastMessage (text: string) {
        this.sendMessage('message', {
            text,
            username: this.user?.username ?? '',
            browserId: this.user?.browserId ?? '',
        });

        this.#addMessage({
            message: text,
            username: this.user?.username ?? '',
            time: Date.now(),
            self: true,
        });
    }

    #addMessage (message: Message) {
        this.updateState({
            messageHistory: [
                ...this.state.messageHistory,
                message,
            ],
        });
    }
}

export const groupWatch = new GroupWatch();

export const useGroupWatch = groupWatch.createStateHook();
export const useGroupWatchActions = groupWatch.createActionsHook();
export const useGroupWatchEvents = groupWatch.createEventsHook();
