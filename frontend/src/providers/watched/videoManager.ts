import { EventNotifier } from '@eleven-am/notifier';
import Hls from 'hls.js';

import { clamp } from '@/utils/helpers';


interface VideoState {
    duration: number;
    currentTime: number;
    volume: number;
    muted: boolean;
    playbackRate: number;
    paused: boolean;
    buffered: TimeRanges | null;
    buffering: boolean;
    error: MediaError | null;
    pip: boolean;
}

const defaultState: VideoState = {
    duration: 0,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    paused: true,
    buffered: null,
    buffering: true,
    error: null,
    pip: false,
};

export interface VideoEvent {
    onHookedUp: HTMLVideoElement;
    onPlayChange: boolean;
    onVolumeChange: { volume: number, muted: boolean };
    playbackBlocked: boolean;
}

class VideoManager extends EventNotifier<VideoState, VideoEvent> {
    #video: HTMLVideoElement | null;

    #hls: Hls | null;

    constructor () {
        super(defaultState);

        this.#video = null;
        this.#hls = null;
    }

    public setVideo (playbackId: string, canDirectPlay: boolean, percentage: number) {
        return (video: HTMLVideoElement | null) => {
            if (!video) {
                this.cleanUp();
            }

            if (!video || video === this.#video || !playbackId) {
                return;
            }

            this.#hookUpHLSPlayer(video, playbackId, canDirectPlay, percentage > 0);
            this.#video = video;

            this.updateState({
                duration: !isNaN(video.duration) ? video.duration : 0,
                currentTime: video.currentTime,
                volume: video.volume,
                muted: video.muted,
                playbackRate: video.playbackRate,
                paused: video.paused,
                buffered: video.buffered,
                error: video.error,
            });

            this.#hookupVideoEvents(video, percentage);

            this.emit('onHookedUp', video);

            this.updateState({
                buffering: this.#isBuffering(),
            });
        };
    }

    async play () {
        try {
            await this.#video?.play();
        } catch (e) {
            this.emit('playbackBlocked', true);
            this.updateState({
                error: e as MediaError,
            });
        }
    }

    pause () {
        this.#video?.pause();
    }

    mute () {
        if (this.#video) {
            this.#video.muted = true;
        }
    }

    unmute () {
        if (this.#video) {
            this.#video.muted = false;
        }
    }

    setVolume (volume: number) {
        if (this.#video) {
            this.#video.volume = clamp(volume, 0, 1);
        }
    }

    seek (time: number) {
        if (this.#video) {
            this.#video.currentTime = time;
        }
    }

    setPlaybackRate (rate: number) {
        if (this.#video) {
            this.#video.playbackRate = rate;
        }
    }

    playOrPause () {
        if (this.#video) {
            if (this.#video.paused) {
                this.#video.play();
            } else {
                this.#video.pause();
            }
        }
    }

    muteOrUnmute () {
        if (this.#video) {
            this.#video.muted = !this.#video.muted;
        }
    }

    async togglePip () {
        if (this.#video) {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await this.#video.requestPictureInPicture();
            }
        }
    }

    getCurrentTime () {
        return this.state.currentTime;
    }

    cleanUp () {
        this.#video?.pause();
        this.#video?.removeAttribute('src');
        this.updateState(defaultState);
        this.#video = null;
        this.#hls?.destroy();
    }

    #hookupVideoEvents (video: HTMLVideoElement, percentage: number) {
        video.addEventListener('waiting', () => {
            this.updateState({
                buffering: true,
            });
        });

        video.addEventListener('durationchange', () => {
            const currentTime = (percentage * video.duration) / 100;

            this.updateState({
                duration: video.duration,
            });

            this.seek(currentTime);
        });

        video.addEventListener('timeupdate', () => {
            this.updateState({
                currentTime: video.currentTime,
                buffering: this.#isBuffering(),
            });
        });

        video.addEventListener('volumechange', () => {
            const {
                volume,
                muted,
            } = video;

            const event = {
                volume,
                muted,
            };

            this.updateState(event);
            this.emit('onVolumeChange', event);
        });

        video.addEventListener('mute', () => {
            const {
                volume,
                muted,
            } = video;

            const event = {
                volume,
                muted,
            };

            this.updateState(event);
            this.emit('onVolumeChange', event);
        });

        video.addEventListener('ratechange', () => {
            this.updateState({
                playbackRate: video.playbackRate,
            });
        });

        video.addEventListener('pause', () => {
            this.updateState({
                paused: true,
            });

            this.emit('onPlayChange', false);
        });

        video.addEventListener('play', () => {
            this.updateState({
                paused: false,
            });

            this.emit('onPlayChange', true);
        });

        video.addEventListener('progress', () => {
            this.updateState({
                buffered: video.buffered,
            });
        });

        video.addEventListener('error', () => {
            this.updateState({
                error: video.error,
            });
        });

        video.addEventListener('enterpictureinpicture', () => {
            this.updateState({
                pip: true,
            });
        });

        video.addEventListener('leavepictureinpicture', () => {
            this.updateState({
                pip: false,
            });
        });
    }

    #isBuffering () {
        if (!this.#video) {
            return true;
        }

        return this.#video.readyState < this.#video.HAVE_FUTURE_DATA || this.#video.seeking;
    }

    #hookUpHLSPlayer (video: HTMLVideoElement, playbackId: string, canDirectPlay: boolean, autoPLay: boolean) {
        if (canDirectPlay) {
            video.src = `/api/stream/${playbackId}`;

            this.#hls?.destroy();
            this.#hls = null;
        } else {
            const hlsUrl = `/api/stream/${playbackId}/master.m3u8`;

            if (Hls.isSupported()) {
                video.autoplay = autoPLay;
                video.preload = autoPLay ? 'auto' : 'metadata';

                this.#hls?.destroy();
                this.#hls = new Hls({
                    debug: false,
                    enableWorker: true,

                    maxBufferLength: 20,
                    backBufferLength: 5,
                    maxMaxBufferLength: 180,
                    maxBufferSize: 40 * 1000 * 1000,

                    maxBufferHole: 0.1,
                    nudgeOffset: 0.02,
                    nudgeMaxRetry: 8,
                    maxFragLookUpTolerance: 0.05,

                    highBufferWatchdogPeriod: 0.5,

                    fragLoadingTimeOut: 15000,
                    fragLoadingMaxRetry: 4,
                    fragLoadingRetryDelay: 200,

                    manifestLoadingTimeOut: 8000,
                    manifestLoadingMaxRetry: 3,

                    autoStartLoad: true,
                    startPosition: -1,
                    capLevelToPlayerSize: false,

                    startFragPrefetch: true,
                    testBandwidth: true,
                    abrEwmaFastLive: 3,
                    abrEwmaSlowLive: 9,
                });

                this.#hls.loadSource(hlsUrl);
                this.#hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = hlsUrl;
            } else {
                video.src = `/api/stream/${playbackId}`;
            }
        }
    }
}

export const videoManager = new VideoManager();
export const useVideoManager = videoManager.createStateHook();
export const useVideoManagerActions = videoManager.createActionsHook();
