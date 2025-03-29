import { Notifier, selector, EventNotifier } from '@eleven-am/notifier';

import { VideoEvent, videoManager } from '@/providers/watched/videoManager';
import { CHROMECAST_APP_ID, CHROMECAST_NAMESPACE } from '@/utils/constants';

interface NamespaceMessage {
    namespace: string;
    message: string;
}

export interface CustomData {
    backdrop: string;
    source: string;
    name: string;
}

interface CastState {
    available: boolean;
    connected: boolean;
    volume: number;
    paused: boolean;
    muted: boolean;
    device: string;
    duration: number;
    currentTime: number;
    casting: boolean;
    playbackRate: number;
    buffering: boolean;
    namespaceMessages: NamespaceMessage[];
    end: boolean;
}

interface AirplayState {
    available: boolean;
    connected: boolean;
    error: string | null;
}

export enum Provider {
    CHROMECAST = 'chromecast',
    AIRPLAY = 'airplay',
}

const defaultState: CastState = {
    available: false,
    connected: false,
    volume: 1,
    paused: true,
    muted: false,
    device: '',
    duration: 0,
    currentTime: 0,
    playbackRate: 1,
    casting: false,
    end: false,
    buffering: false,
    namespaceMessages: [],
};

type CastEvent = Omit<VideoEvent, 'onHookedUp'> & {
    onMessage: NamespaceMessage;
}

declare global {
    interface HTMLElement {
        webkitShowPlaybackTargetPicker?: () => void;
    }
}

class ChromecastManager extends EventNotifier<CastState, CastEvent> {
    #player: cast.framework.RemotePlayer | null;

    #castSession: cast.framework.CastSession | null;

    #controller: cast.framework.RemotePlayerController | null;

    #context: cast.framework.CastContext | null;

    constructor () {
        super(defaultState);
        this.#player = null;
        this.#castSession = null;
        this.#controller = null;
        this.#context = null;

        this.#initialise();
    }

    isAvailable (): boolean {
        return this.state.available;
    }

    isConnected (): boolean {
        return this.state.connected;
    }

    connect () {
        if (this.isConnected()) {
            return;
        }

        this.#context?.requestSession();
    }

    disconnect () {
        if (!this.isConnected()) {
            return;
        }

        this.#context?.endCurrentSession(true);
        this.#controller?.stop();
        this.reset();
    }

    cast (currentTime: number, customData: CustomData) {
        if (this.state.casting) {
            this.disconnect();

            return;
        }

        this.connect();
        const mediaInfo = new chrome.cast.media.MediaInfo(
            customData.source,
            'video/mp4',
        );

        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
        mediaInfo.metadata.title = customData.name;
        mediaInfo.metadata.images = [
            {
                url: customData.backdrop,
            },
        ];

        mediaInfo.customData = customData;

        const request = new chrome.cast.media.LoadRequest(mediaInfo);

        request.currentTime = currentTime;

        if (this.#castSession) {
            this.#castSession.loadMedia(request)
                .then(() => {
                    this.updateState({
                        casting: true,
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }

    setVolume (volume: number) {
        if (this.#player && this.#controller) {
            this.#player.volumeLevel = volume;
            this.#controller.setVolumeLevel();
        }
    }

    seek (time: number) {
        if (this.#player && this.#controller) {
            this.#player.currentTime = time;
            this.#controller.seek();
        }
    }

    playOrPause () {
        if (this.#controller) {
            this.#controller.playOrPause();
        }
    }

    muteOrUnmute () {
        if (this.#controller) {
            this.#controller.muteOrUnmute();
        }
    }

    getCurrentTime () {
        return this.#player?.currentTime || 0;
    }

    play () {
        if (this.#controller && this.state.paused) {
            this.#controller.playOrPause();
        }
    }

    pause () {
        if (this.#controller && !this.state.paused) {
            this.#controller.playOrPause();
        }
    }

    sendNamespacedMessage (message: string) {
        if (this.#castSession) {
            this.#castSession.sendMessage(
                CHROMECAST_NAMESPACE,
                message,
            )
                .catch((error) => {
                    console.error(error);
                });
        }
    }

    setPlaybackRate (rate: number) {}

    #initialise (tries = 0) {
        if (tries > 50) {
            return;
        }

        if (!(window.chrome && window.chrome.cast)) {
            setTimeout(() => this.#initialise(tries + 1), 100);

            return;
        }

        try {
            this.#hookupVideoEvents();
        } catch (error) {
            setTimeout(() => this.#initialise(tries + 1), 100);
        }
    }

    #onSessionStateChange (event: cast.framework.SessionStateEventData) {
        if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
            this.#castSession = this.#context?.getCurrentSession() || null;
            this.#castSession?.addMessageListener(
                CHROMECAST_NAMESPACE,
                this.#onMessage.bind(this),
            );
        } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
            this.#castSession?.removeMessageListener(
                CHROMECAST_NAMESPACE,
                this.#onMessage.bind(this),
            );
            this.#castSession = null;
        }
    }

    #hookupVideoEvents () {
        this.#context = cast.framework.CastContext.getInstance();
        this.#context.setOptions({
            receiverApplicationId: CHROMECAST_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
        });

        this.#context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            this.#onSessionStateChange.bind(this),
        );

        this.#context.addEventListener(
            cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            this.#onCastStateChange.bind(this),
        );

        this.#castSession = this.#context.getCurrentSession();
        this.#player = new cast.framework.RemotePlayer();
        this.#controller = new cast.framework.RemotePlayerController(this.#player);

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED,
            this.#onPausedChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.IS_MUTED_CHANGED,
            this.#onMutedChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED,
            this.#onVolumeChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED,
            this.#onTimeChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.DURATION_CHANGED,
            this.#onDurationChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED,
            this.#onMediaLoadedChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED,
            this.#onPlayerStateChange.bind(this),
        );

        this.#controller.addEventListener(
            cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
            this.#onConnectedChange.bind(this),
        );

        this.updateState({
            available: true,
        });
    }

    #onCastStateChange (event: cast.framework.CastStateEventData) {
        this.updateState({
            connected: event.castState === cast.framework.CastState.CONNECTED,
            device: this.#castSession?.getCastDevice().friendlyName || '',
        });
    }

    #onMessage (namespace: string, message: string) {
        const messages = this.state.namespaceMessages.slice();

        messages.push({
            namespace,
            message,
        });
        this.updateState({
            namespaceMessages: messages,
        });

        this.emit('onMessage', JSON.parse(message) as NamespaceMessage);
    }

    #onPausedChange () {
        this.updateState({
            paused: this.#player?.isPaused || false,
        });
    }

    #onMutedChange () {
        this.updateState({
            muted: this.#player?.isMuted || false,
        });

        const event = {
            volume: this.#player?.volumeLevel || 0,
            muted: this.#player?.isMuted || false,
        };

        this.emit('onVolumeChange', event);
    }

    #onVolumeChange () {
        this.updateState({
            volume: this.#player?.volumeLevel || 0,
        });

        const event = {
            volume: this.#player?.volumeLevel || 0,
            muted: this.#player?.isMuted || false,
        };

        this.emit('onVolumeChange', event);
    }

    #onTimeChange () {
        this.updateState({
            currentTime: this.#player?.currentTime || 0,
        });
    }

    #onDurationChange () {
        this.updateState({
            duration: this.#player?.duration || 0,
        });
    }

    #onMediaLoadedChange () {
        this.updateState({
            end: this.#player?.isMediaLoaded || false,
        });
    }

    #onPlayerStateChange () {
        this.updateState({
            paused: this.#player?.playerState === chrome.cast.media.PlayerState.PAUSED,
            buffering: this.#player?.playerState === chrome.cast.media.PlayerState.BUFFERING,
        });

        const playing = this.#player?.playerState === chrome.cast.media.PlayerState.PLAYING;

        this.emit('onPlayChange', playing);
    }

    #onConnectedChange () {
        this.updateState({
            connected: this.#player?.isConnected || false,
        });
    }
}

class AirplayManager extends Notifier<AirplayState> {
    #player: HTMLVideoElement | null;

    constructor () {
        super({
            available: false,
            connected: false,
            error: null,
        });

        this.#player = null;

        videoManager.on('onHookedUp', this.#onHookedUp.bind(this));
    }

    connect () {
        if (this.#player && this.state.available && this.#player.webkitShowPlaybackTargetPicker) {
            this.#player.webkitShowPlaybackTargetPicker();
        }
    }

    isAvailable () {
        return this.state.available;
    }

    #onHookedUp (video: HTMLVideoElement) {
        video.addEventListener('webkitplaybacktargetavailabilitychanged', (evt: any) => {
            this.updateState({
                available: evt.availability === 'available',
            });
        });

        video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', (evt: any) => {
            this.updateState({
                connected: evt.target.remote.state === 'connected',
            });
        });

        this.#player = video;
    }
}

export const chromecastManager = new ChromecastManager();

export const airplayManager = new AirplayManager();

const castSelector = selector((get) => {
    const chromecast = get(chromecastManager);
    const airplay = get(airplayManager);

    return {
        available: chromecast.available || airplay.available,
        provider: chromecast.available ? Provider.CHROMECAST : Provider.AIRPLAY,
        connected: chromecast.connected || airplay.connected,
        device: chromecast.device,
    };
});

export const useCastSelector = castSelector.createStateHook();
