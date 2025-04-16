import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { SubtitleSchema, NodeCueSchema } from '@/api/data-contracts';
import { useProgressAndVolume } from '@/providers/watched/playerPageStates';
import { usePlayerUI, usePlayerUIActions } from '@/providers/watched/playerUI';
import { watchQueries } from '@/queries/watch';
import { useLocalStorage } from "@/hooks/useLocalStorage";


const SUBTITLE_STORAGE_KEY = 'subtitles';

export interface SubtitleData {
    url: string;
    label: string;
    srcLang: string;
}

export function useFetchSubtitles (availableSubtitles: SubtitleSchema[], canAccessStream: boolean) {
    const [language, setLanguage] = useLocalStorage(SUBTITLE_STORAGE_KEY, 'None');
    const subtitleId = useMemo(() => availableSubtitles.find((sub) => sub.language === language)?.subtitleId, [availableSubtitles, language]);
    const { data } = useQuery(watchQueries.cues(subtitleId, canAccessStream));

    const subtitleData = useMemo((): SubtitleData | null => {
        if (!data) {
            return null;
        }

        return {
            label: data.label,
            srcLang: data.srcLang,
            url: data.subtitleUrl,
        };
    }, [data]);

    return {
        language,
        subtitleId,
        setLanguage,
        offset: data?.offset || 0,
        cues: data?.nodes || [],
        data: subtitleData,
    };
}

export function useSubtitles (availableSubtitles: SubtitleSchema[], canAccessStream: boolean) {
    const { setSyncTime } = usePlayerUIActions();
    const { cues, setLanguage, language, subtitleId, offset } = useFetchSubtitles(availableSubtitles, canAccessStream);
    const { syncTime, displayControls } = usePlayerUI(({ syncTime, displayControls }) => ({
        syncTime,
        displayControls,
    }));

    useEffect(() => setSyncTime(offset), [offset, setSyncTime]);

    const { currentTime, paused } = useProgressAndVolume(({ currentTime, paused }) => ({
        currentTime,
        paused,
    }));

    const subtitles = useMemo(() => cues.map((sub): NodeCueSchema => ({
        start: sub.start + syncTime,
        end: sub.end + syncTime,
        text: sub.text,
    })), [cues, syncTime]);

    const subtitle = useMemo(() => subtitles
        .find((sub) => sub.start <= (currentTime * 1000) && sub.end >= (currentTime * 1000)) ||
        null,
    [currentTime, subtitles]);

    return useMemo(() => ({
        subtitle: paused ? null : subtitle,
        subtitleId: subtitleId || '',
        moveUp: displayControls,
        setLanguage,
        language,
    }), [paused, subtitle, subtitleId, displayControls, setLanguage, language]);
}

export function useThumbnails (playbackId: string, canAccessStream: boolean) {
    const [enableFetch, setEnableFetch] = useState(true);
    const { data: thumbnails } = useQuery(watchQueries.thumbnails(playbackId, canAccessStream, enableFetch));

    useEffect(() => {
        if (thumbnails?.find((thumbnail) => thumbnail.percentage === 1)) {
            setEnableFetch(false);
        }
    }, [thumbnails]);

    return thumbnails;
}

