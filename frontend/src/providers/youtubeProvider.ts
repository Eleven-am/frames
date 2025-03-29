// / <reference types="youtube" />

import { EventNotifier } from '@eleven-am/notifier';

import { navbarProvider } from '@/providers/navbarProvider';
import { isMobileDevice } from '@/utils/style';


interface YoutubeState {
    videoId: string | null;
    startedPlaying: boolean;
    finishedPlaying: boolean;
    playerState: YT.PlayerState;
    loading: boolean;
    muted: boolean;
}

interface YoutubeEvents {
    start: YoutubeState;
    play: YoutubeState;
    pause: YoutubeState;
    ended: YoutubeState;
}

class YoutubeNotifier extends EventNotifier<YoutubeState, YoutubeEvents> {
    #player: YT.Player | null;

    #holder: HTMLElement | null;

    constructor () {
        super({
            videoId: null,
            startedPlaying: false,
            finishedPlaying: false,
            muted: false,
            playerState: -1,
            loading: false,
        });

        this.#player = null;
        this.#holder = null;
    }

    public playVideo (videoId: string): void {
        this.updateState({
            loading: true,
        });
        if (this.state.videoId === videoId) {
            this.#player?.playVideo();

            return;
        }

        if (this.#holder) {
            this.#createPlayer(videoId, this.#holder)
                .then((player) => {
                    this.emit('start', this.state);
                    navbarProvider.setHideNav(true);
                    this.#player = player;
                    this.updateState({
                        videoId,
                    });
                    player.playVideo();
                });
        }
    }

    public setHolder (holder: HTMLElement | null): void {
        this.#holder = holder;
    }

    public togglePlay (): void {
        if (this.#player) {
            if (this.#player.getPlayerState() === YT.PlayerState.PLAYING) {
                this.#player.pauseVideo();
            } else {
                this.#player.playVideo();
            }
        }
    }

    public stopVideo (): void {
        this.#player?.stopVideo();
    }

    public seekTo (seconds: number): void {
        this.#player?.seekTo(seconds, false);
    }

    public getCurrentTime (): number {
        return this.#player?.getCurrentTime() || 0;
    }

    public getDuration (): number {
        return this.#player?.getDuration() || 0;
    }

    public changeVolume (volume: number): void {
        this.#player?.setVolume(volume);
    }

    public getVolume (): number {
        return this.#player?.getVolume() || 0;
    }

    public mute (): void {
        this.#player?.mute();
        this.updateState({
            muted: true,
        });
    }

    public unMute (): void {
        this.#player?.unMute();
        this.updateState({
            muted: false,
        });
    }

    public addVideoToPlaylist (videoId: string): void {
        this.#player?.cueVideoById(videoId);
    }

    public hasStartedPlaying (): boolean {
        return this.state.startedPlaying;
    }

    public destroy () {
        this.updateState({
            startedPlaying: false,
        });
        this.#player?.destroy();
        navbarProvider.setHideNav(false);
        this.emit('ended', this.state);
        this.#player = null;
        super.reset();
    }

    #onPlayerReady (event: YT.PlayerEvent): void {
        event.target.playVideo();
        this.updateState({
            playerState: event.target.getPlayerState(),
            muted: event.target.isMuted(),
            startedPlaying: true,
            finishedPlaying: false,
        });
    }

    #onPlayerStateChange (event: YT.OnStateChangeEvent): void {
        switch (event.data) {
            case YT.PlayerState.PLAYING:
                this.updateState({
                    startedPlaying: true,
                    finishedPlaying: false,
                    playerState: event.data,
                });
                this.emit('play', this.state);
                break;
            case YT.PlayerState.ENDED:
                this.destroy();
                this.emit('ended', this.state);
                break;
            case YT.PlayerState.PAUSED:
                this.updateState({
                    playerState: event.data,
                });
                this.emit('pause', this.state);
                break;
            default:
                this.updateState({
                    playerState: event.data,
                });
        }
    }

    #createPlayer (videoId: string, holder: HTMLElement): Promise<YT.Player> {
        if (isMobileDevice()) {
            this.#openYoutubeApp(videoId);

            return Promise.reject(new Error('Mobile device detected'));
        }

        return new Promise<YT.Player>((resolve) => {
            new YT.Player(holder, {
                videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    playsinline: 0,
                },
                events: {
                    onReady: (event) => {
                        this.#onPlayerReady(event);
                        resolve(event.target);
                    },
                    onStateChange: (event) => this.#onPlayerStateChange(event),
                },
            });
        });
    }

    #openYoutubeApp (videoId: string) {
        this.destroy();
        const youtubeUrl = `vnd.youtube://${videoId}`;
        const fallbackUrl = `https://www.youtube.com/watch?v=${videoId}`;

        window.location.href = youtubeUrl;

        setTimeout(() => {
            if (document.hidden) {
                return;
            }

            window.open(fallbackUrl, '_blank');
        }, 2000);
    }
}

const youtubeNotifier = new YoutubeNotifier();

export const useYoutubeState = youtubeNotifier.createStateHook();
export const useYoutubeActions = youtubeNotifier.createActionsHook();
export const useYoutubeEvents = youtubeNotifier.createEventsHook();
