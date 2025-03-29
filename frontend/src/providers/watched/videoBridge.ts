import { getSnapshot } from '@eleven-am/notifier';

import { groupWatch } from '@/providers/groupWatch';
import { chromecastManager } from '@/providers/watched/castManager';
import { playerUI } from '@/providers/watched/playerUI';
import { videoManager } from '@/providers/watched/videoManager';

class VideoBridge {
    #sessionStarted: boolean;

    #syncTime: number | null;

    constructor () {
        this.#init();

        this.#sessionStarted = false;
        this.#syncTime = null;
    }

    getCurrentTime () {
        return this.#getActivePlayer().getCurrentTime();
    }

    getIsPaused () {
        return this.#getActiveState().paused;
    }

    muteOrUnmute () {
        this.#getActivePlayer()
            .muteOrUnmute();

        playerUI.showLeftControls();
    }

    playOrPause () {
        const isPaused = this.#getActiveState().paused;
        const isBlocked = getSnapshot(playerUI).playbackBlocked;

        this.#getActivePlayer()
            .playOrPause();

        if (isBlocked) {
            playerUI.playerUnblocked();
        }

        playerUI.showControls();
        groupWatch.sendPlayState(this.getCurrentTime(), !isPaused);
    }

    play () {
        this.#getActivePlayer()
            .play();

        playerUI.showControls();
    }

    pause () {
        this.#getActivePlayer()
            .pause();

        playerUI.showControls();
    }

    seek (time: number, broadcast = true) {
        this.#getActivePlayer()
            .seek(time);

        playerUI.showControls();

        if (broadcast) {
            groupWatch.sendSeeked(time);
        }
    }

    seekFromCurrent (time: number) {
        const currentTime = this.getCurrentTime();

        this.seek(currentTime + time);
    }

    setVolume (volume: number) {
        this.#getActivePlayer()
            .setVolume(volume);

        playerUI.showLeftControls();
    }

    setPlaybackRate (rate: number) {
        this.#getActivePlayer()
            .setPlaybackRate(rate);
    }

    reset () {
        playerUI.reset();
        videoManager.reset();
        chromecastManager.reset();
        this.#sessionStarted = false;
        this.#syncTime = null;
    }

    setSyncTime (syncTime: number) {
        this.#syncTime = syncTime;
        this.seek(syncTime, false);
    }

    startSession () {
        this.play();
        groupWatch.startSession();
        playerUI.playerCanPlay();
        this.#sessionStarted = true;
    }

    #getActivePlayer () {
        if (chromecastManager.isConnected()) {
            return chromecastManager;
        }

        return videoManager;
    }

    #init () {
        videoManager.on('onVolumeChange', this.#onVolumeChange.bind(this));
        videoManager.on('onPlayChange', this.#onPlayChange.bind(this));
        videoManager.on('playbackBlocked', this.#playbackBlocked.bind(this));
        videoManager.on('onHookedUp', this.#onFirstCanPlay.bind(this));

        chromecastManager.on('onVolumeChange', this.#onVolumeChange.bind(this));
        chromecastManager.on('onPlayChange', this.#onPlayChange.bind(this));
    }

    #onVolumeChange () {
        playerUI.showLeftControls();
    }

    #onPlayChange () {
        playerUI.showControls();
    }

    #playbackBlocked () {
        playerUI.playerBlocked();
    }

    #onFirstCanPlay (video: HTMLVideoElement) {
        const onFirstCanPlay = () => {
            if (this.#syncTime) {
                this.seek(this.#syncTime, false);
            }

            if ((!this.#sessionStarted && groupWatch.isConnected())) {
                return;
            }

            this.play();
            playerUI.playerCanPlay();
        };

        video.addEventListener('canplay', onFirstCanPlay, {
            once: true,
        });
    }

    #getActiveState () {
        if (chromecastManager.isConnected()) {
            const state = getSnapshot(chromecastManager);

            return {
                paused: state.paused,
                currentTime: state.currentTime,
                playbackRate: state.playbackRate,
                volume: state.volume,
            };
        }

        const state = getSnapshot(videoManager);

        return {
            paused: state.paused,
            currentTime: state.currentTime,
            playbackRate: state.playbackRate,
            volume: state.volume,
        };
    }
}

export const videoBridge = new VideoBridge();
