import { chromecastManager } from '@/providers/watched/castManager';
import { videoManager } from '@/providers/watched/videoManager';
import { Timer } from '@/utils/timer';
import { Notifier, getSnapshot } from '@eleven-am/notifier';


interface PlayerUIState {
    displayControls: boolean;
    displayLeftControls: boolean;
    displayRightControls: boolean;
    displayInfo: boolean;
    syncTime: number;
    isFullScreen: boolean;
    settingsOpen: boolean;
    hoverOnSubtitles: boolean;
    playbackBlocked: boolean;
    started: boolean;
    isLeftModalsOpen: boolean;
}

const initialState: PlayerUIState = {
    displayControls: true,
    displayLeftControls: true,
    displayRightControls: true,
    isFullScreen: false,
    displayInfo: false,
    syncTime: 0,
    settingsOpen: false,
    started: false,
    hoverOnSubtitles: false,
    playbackBlocked: false,
    isLeftModalsOpen: false,
};

class PlayerUI extends Notifier<PlayerUIState> {
    #controlsTimer: Timer;

    #leftControlsTimer: Timer;

    #rightControlsTimer: Timer;

    #infoTimer: Timer;

    #fullScreenElement: HTMLDivElement | null;

    #hovering: boolean;

    constructor () {
        super(initialState);
        this.#controlsTimer = new Timer();
        this.#leftControlsTimer = new Timer();
        this.#rightControlsTimer = new Timer();
        this.#infoTimer = new Timer();
        this.#fullScreenElement = null;
        this.#hovering = false;
    }

    showControls () {
        if (this.state.playbackBlocked) {
            return;
        }

        this.updateState({
            displayControls: true,
            displayInfo: false,
        });

        this.#controlsTimer.start(() => {
            this.#hideControls();
        }, 5000);

        this.#infoTimer.start(() => {
            const { paused, casting } = getSnapshot(chromecastManager);
            const { paused: paused2 } = getSnapshot(videoManager);

            const pausedState = casting ? paused : paused2;

            if (pausedState && this.state.started) {
                this.updateState({
                    displayInfo: true,
                });
            }
        }, 10000);
    }

    showLeftControls () {
        this.showControls();
        this.updateState({
            displayLeftControls: true,
        });

        this.#leftControlsTimer.start(() => {
            this.#hideLeftControls();
        }, 1000);
    }

    showRightControls () {
        this.showControls();
        this.updateState({
            displayRightControls: true,
        });

        this.#rightControlsTimer.start(() => {
            this.#hideRightControls();
        }, 1000);
    }

    setSyncTime (syncTime: number) {
        this.updateState({
            syncTime,
        });
    }

    openSettings () {
        this.updateState({
            settingsOpen: true,
        });
    }

    closeSettings () {
        this.updateState({
            settingsOpen: false,
        });
    }

    openLeftModals () {
        this.updateState({
            isLeftModalsOpen: true,
        });
    }

    closeLeftModals () {
        this.updateState({
            isLeftModalsOpen: false,
        });
    }

    setFullScreenElement (fullScreenElement: HTMLDivElement | null) {
        this.#fullScreenElement = fullScreenElement;

        fullScreenElement?.addEventListener('fullscreenchange', () => {
            this.updateState({
                isFullScreen: this.#isFullScreen(),
            });
        });
    }

    async toggleFullScreen () {
        this.showControls();

        if (!this.#isFullScreen()) {
            this.#fullScreenElement?.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    }

    reset () {
        this.updateState(initialState);
    }

    setHovering (hovering: boolean) {
        this.#hovering = hovering;
    }

    playerBlocked () {
        this.updateState({
            started: false,
            displayControls: false,
            playbackBlocked: true,
        });
    }

    playerUnblocked () {
        this.updateState({
            playbackBlocked: false,
        });

        this.playerCanPlay();
    }

    playerCanPlay () {
        this.updateState({
            started: true,
        });

        this.showControls();
        this.showLeftControls();
        this.showRightControls();
    }

    #isFullScreen () {
        return Boolean(document.fullscreenElement);
    }

    #hideControls () {
        if (!this.state.started || this.state.playbackBlocked || this.#hovering) {
            return;
        }

        this.#controlsTimer.clear();
        this.updateState({
            displayControls: false,
        });
    }

    #hideLeftControls () {
        if (!this.state.started || this.#hovering) {
            return;
        }

        this.#leftControlsTimer.clear();
        this.updateState({
            displayLeftControls: false,
        });
    }

    #hideRightControls () {
        if (!this.state.started || this.#hovering) {
            return;
        }

        this.#rightControlsTimer.clear();
        this.updateState({
            displayRightControls: false,
        });
    }
}

export const playerUI = new PlayerUI();
export const usePlayerUI = playerUI.createStateHook();
export const usePlayerUIActions = playerUI.createActionsHook();
