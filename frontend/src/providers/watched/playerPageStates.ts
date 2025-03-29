import { userStore } from '@/providers/userProvider';
import { chromecastManager } from '@/providers/watched/castManager';
import { playerSession } from '@/providers/watched/playerSession';
import { playerUI } from '@/providers/watched/playerUI';
import { videoManager } from '@/providers/watched/videoManager';
import { toDuration } from '@/utils/helpers';
import { selector } from '@eleven-am/notifier';


const progressAndVolumeSelector = selector((get) => {
    const {
        currentTime,
        duration,
        volume,
        muted,
        buffered,
        paused,
    } = get(videoManager);

    const {
        currentTime: chromecastCurrentTime,
        duration: chromecastDuration,
        volume: chromecastVolume,
        muted: chromecastMuted,
        paused: chromecastPaused,
        casting,
    } = get(chromecastManager);

    if (casting) {
        const progressCurrent = chromecastCurrentTime / chromecastDuration;

        return {
            bufferedWidth: progressCurrent + 0.01,
            timeRemaining: toDuration(chromecastCurrentTime, chromecastDuration),
            progressCurrent,
            timeElapsed: toDuration(0, chromecastCurrentTime),
            duration: chromecastDuration,
            volume: chromecastVolume,
            muted: chromecastMuted,
            currentTime: chromecastCurrentTime,
            paused: chromecastPaused,
            percentage: !isNaN(progressCurrent) ? progressCurrent * 100 : 0,
        };
    }

    const progressCurrent = (currentTime / duration);
    const timeElapsed = toDuration(0, currentTime);
    const timeRemaining = toDuration(currentTime, duration);

    let temp = currentTime;

    if (buffered && buffered.length) {
        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
                temp = buffered.end(i);
                break;
            }
        }
    }

    const bufferedWidth = (temp / duration);

    return {
        bufferedWidth,
        timeElapsed,
        timeRemaining,
        progressCurrent,
        currentTime,
        paused,
        duration,
        volume,
        muted,
        percentage: !isNaN(progressCurrent) ? progressCurrent * 100 : 0,
    };
});

export const useProgressAndVolume = progressAndVolumeSelector.createStateHook();

const countdownSelector = selector((get) => {
    const { currentTime, duration } = get(progressAndVolumeSelector);
    const { autoPlay } = get(playerSession);

    if (isNaN(currentTime) || isNaN(duration)) {
        return null;
    }

    if (duration === 0) {
        return null;
    }

    if (currentTime === duration) {
        return null;
    }

    if (!autoPlay) {
        return null;
    }

    if (((duration - currentTime) > 60) || ((currentTime / duration) < 0.95)) {
        return null;
    }

    const difference = Math.floor(duration - currentTime);

    return {
        difference,
        display: `${difference}s`,
    };
});

export const useCountdown = countdownSelector.createStateHook();

const playbackStateSelector = selector((get) => {
    const { paused, casting } = get(chromecastManager);
    const { paused: paused2 } = get(videoManager);
    const { playbackBlocked } = get(playerUI);

    const playing = casting ? !paused : !paused2;

    return {
        playing,
        display: playbackBlocked,
    };
});

export const usePlaybackState = playbackStateSelector.createStateHook();

const playbackModalSelector = selector((get) => {
    const { settingsOpen, syncTime } = get(playerUI);
    const { inform, autoPlay } = get(playerSession);
    const { casting, playbackRate } = get(chromecastManager);
    const { playbackRate: playbackRate2 } = get(videoManager);
    const incognito = get(userStore).session?.incognito ?? false;

    const rate = casting ? playbackRate : playbackRate2;

    return {
        settingsOpen,
        syncTime,
        inform,
        autoPlay,
        incognito,
        rate,
    };
});

export const usePlaybackModalSelector = playbackModalSelector.createStateHook();

const bufferingSelector = selector((get) => {
    const { buffering: castBuffering, casting } = get(chromecastManager);
    const { buffering: videoBuffering } = get(videoManager);

    return casting ? castBuffering : videoBuffering;
});

export const useBuffering = bufferingSelector.createStateHook();
