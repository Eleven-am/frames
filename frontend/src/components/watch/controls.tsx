import { PlaybackSessionSchema } from '@/api/data-contracts';
import { Buffering } from '@/components/watch/buffering';
import { Casting } from '@/components/watch/casting';
import { LowerControls } from '@/components/watch/lowerControls';
import { MediaInformation } from '@/components/watch/mediaInformation';
import { PlayerSettingsModal } from '@/components/watch/playerSettingsModal';
import { PlayerStateIndicator } from '@/components/watch/playerStateIndicator';
import { Subtitles } from '@/components/watch/subtitles';
import { TopUI } from '@/components/watch/topUI';
import { useEventListener } from '@/hooks/useEventListener';
import { useFetchSubtitles } from '@/hooks/useSubtitles';
import { useCountdown, useProgressAndVolume } from '@/providers/watched/playerPageStates';
import { usePlayerUI, usePlayerUIActions } from '@/providers/watched/playerUI';
import { videoBridge } from '@/providers/watched/videoBridge';
import { useVideoManagerActions } from '@/providers/watched/videoManager';
import { watchQueries } from '@/queries/watch';
import { tw } from '@/utils/style';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';

export function Listener ({ playbackId }: { playbackId: string }) {
    const router = useRouter();
    const { togglePip } = useVideoManagerActions();
    const { data } = useQuery(watchQueries.upNext(playbackId));
    const { toggleFullScreen, openSettings } = usePlayerUIActions();
    const volume = useProgressAndVolume((state) => state.volume);
    const isLeftModalsOpen = usePlayerUI((state) => state.isLeftModalsOpen);

    useEventListener('keydown', async (event) => {
        if (isLeftModalsOpen) {
            return;
        }

        if (event.code === 'KeyM') {
            videoBridge.muteOrUnmute();
        }

        if (event.code === 'ArrowUp') {
            videoBridge.setVolume(volume + 0.05);
        }

        if (event.code === 'ArrowDown') {
            videoBridge.setVolume(volume - 0.05);
        }

        if (event.code === 'Space') {
            videoBridge.playOrPause();
        }

        if (event.code === 'ArrowLeft') {
            videoBridge.seekFromCurrent(-10);
        }

        if (event.code === 'ArrowRight') {
            videoBridge.seekFromCurrent(10);
        }

        if (event.code === 'KeyP') {
            await togglePip();
        }

        if (event.code === 'KeyF') {
            await toggleFullScreen();
        }

        if (event.code === 'KeyN') {
            await router.navigate({
                to: '/watch',
                search: {
                    playlistVideoId: data?.playlistVideoId ?? undefined,
                    videoId: data?.playlistVideoId ? undefined : data?.videoId,
                },
            });
        }

        if (event.code === 'KeyS') {
            openSettings();
        }
    });

    return null;
}

export function Controls ({ session }: { session: PlaybackSessionSchema }) {
    useFetchSubtitles(session.availableSubtitles, session.canAccessStream);
    const { showControls } = usePlayerUIActions();
    // const thumbnails = useThumbnails(session.playbackId, session.canAccessStream);
    const shrunk = useCountdown((state) => Boolean(state));
    const handleMouseMove = useCallback(() => showControls(), [showControls]);
    const displayControls = usePlayerUI((state) => state.displayControls || state.playbackBlocked);

    if (shrunk) {
        return null;
    }

    return (
        <>
            <Casting name={session.name} backdrop={session.backdrop} />
            <Buffering />
            <Subtitles
                availableSubtitles={session.availableSubtitles}
                canAccessStream={session.canAccessStream}
            />
            <MediaInformation
                name={session.name}
                poster={session.poster}
                overview={session.overview}
                playbackId={session.playbackId}
                episodeName={session.episodeName}
                episodeOverview={session.episodeOverview}
                episodeBackdrop={session.episodeBackdrop}
            />
            <div
                onMouseMove={handleMouseMove}
                className={
                    tw('absolute top-0 left-0 w-full h-full', {
                        'opacity-100': displayControls,
                        'opacity-0 cursor-none': !displayControls,
                    })
                }
            >
                <PlayerStateIndicator />
                <TopUI
                    name={session.name}
                    logo={session.logo}
                    episodeName={session.episodeName}
                    mediaId={session.mediaId}
                    type={session.mediaType}
                />
                <LowerControls
                    episodeName={session.episodeName}
                    playbackId={session.playbackId}
                    videoId={session.videoId}
                    mediaId={session.mediaId}
                    thumbnails={[]}
                    name={session.name}
                />
            </div>
            <PlayerSettingsModal
                availableSubtitles={session.availableSubtitles}
                playbackId={session.playbackId}
                canAccessStream={session.canAccessStream}
            />
        </>
    );
}
