import { useState, useCallback, useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { SubtitleSchema } from '@/api/data-contracts';
import { SliderEvent } from '@/components/slider';
import { useEventListener } from '@/hooks/useEventListener';
import { useTimer } from '@/hooks/useIntervals';
import { useSubtitles } from '@/hooks/useSubtitles';
import { usePlaybackModalSelector } from '@/providers/watched/playerPageStates';
import { usePlayerSessionActions } from '@/providers/watched/playerSession';
import { usePlayerUIActions } from '@/providers/watched/playerUI';
import { videoBridge } from '@/providers/watched/videoBridge';
import { watchMutations } from '@/queries/watch';

export function usePlayerSettings (availableSubtitles: SubtitleSchema[], playbackId: string, canAccessStream: boolean) {
    const { stop, start } = useTimer();
    const { mutate } = useMutation(watchMutations.updateOffset);
    const { closeSettings, setSyncTime } = usePlayerUIActions();
    const [displayedSubtitle, setDisplayedSubtitle] = useState(false);
    const { stop: stopUpdateOffset, start: startUpdateOffset } = useTimer();
    const { setInform, setAutoPlay, setIncognito } = usePlayerSessionActions();
    const { settingsOpen, syncTime, incognito, rate, inform, autoPlay } = usePlaybackModalSelector();
    const { subtitle, setLanguage, language, subtitleId } = useSubtitles(availableSubtitles, canAccessStream);
    const languages = useMemo(() => availableSubtitles.map((sub) => sub.language), [availableSubtitles]);
    const handleAutoPlayChange = useCallback((autoPlay: boolean) => setAutoPlay(autoPlay), [setAutoPlay]);
    const handleInformChange = useCallback((inform: boolean) => setInform(inform, playbackId), [setInform, playbackId]);

    const manageDisplaySubtitle = useCallback(() => {
        stop();
        setDisplayedSubtitle(true);
        start(() => setDisplayedSubtitle(false), 5000);
    }, [start, stop]);

    const handleActiveSubtitleChange = useCallback((activeSubtitle: string) => {
        setSyncTime(0);
        manageDisplaySubtitle();
        setLanguage(activeSubtitle);
    }, [manageDisplaySubtitle, setLanguage, setSyncTime]);

    const handleSyncTimeChange = useCallback((time: number) => {
        const newTime = syncTime + time;

        stopUpdateOffset();
        manageDisplaySubtitle();
        setSyncTime(newTime);
        startUpdateOffset(() => mutate({
            subtitleId,
            offset: newTime,
        }), 1000 * 60);
    }, [
        manageDisplaySubtitle,
        startUpdateOffset,
        stopUpdateOffset,
        setSyncTime,
        subtitleId,
        syncTime,
        mutate,
    ]);

    const handlePlaybackSpeedChange = useCallback((event: SliderEvent) => {
        const speed = (event.percentage * 2);

        videoBridge.setPlaybackRate(speed);
    }, []);

    useEventListener('keydown', (event) => {
        if (!settingsOpen) {
            return;
        }

        if (event.key === 'Escape') {
            closeSettings();
        }

        if (event.key === 'ArrowUp') {
            handleSyncTimeChange(500);
        }

        if (event.key === 'ArrowDown') {
            handleSyncTimeChange(-500);
        }
    });

    return {
        activeSubtitle: language,
        handlePlaybackSpeedChange,
        handleActiveSubtitleChange,
        handleSyncTimeChange,
        handleAutoPlayChange,
        handleInformChange,
        displayedSubtitle,
        settingsOpen,
        syncTime,
        incognito,
        rate,
        inform,
        autoPlay,
        closeSettings,
        subtitle,
        setIncognito,
        languages,
    };
}
