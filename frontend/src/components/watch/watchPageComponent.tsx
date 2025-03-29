import { PlaybackSessionSchema } from '@/api/data-contracts';
import { Loading } from '@/components/loading-set/Loading';
import { Controls, Listener } from '@/components/watch/controls';
import { FullScreenTrackedComponent } from '@/components/watch/fullscreen';
import { UpNextItem } from '@/components/watch/upNextItem';
import { VideoPlayer } from '@/components/watch/videoPlayer';
import { useInitialiseClientState } from '@/hooks/useInitialiseClientState';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlayerSessionActions } from '@/providers/watched/playerSession';
import { videoBridge } from '@/providers/watched/videoBridge';
import { useRouter } from '@tanstack/react-router';


interface WatchPageComponentProps {
    isGroupWatch?: boolean;
    isFrame?: boolean;
    session?: PlaybackSessionSchema;
}

export function WatchPageComponent ({ session, isGroupWatch, isFrame }: WatchPageComponentProps) {
    const router = useRouter();
    const { setIsFrame } = usePlayerSessionActions();

    useInitialiseClientState(setIsFrame, isFrame || false);
    useSubscription(() => router.subscribe('onLoad', () => videoBridge.reset()));

    if (!session) {
        return <Loading />;
    }

    if (isGroupWatch) {
        return (
            <div className={'relative w-full h-svh flex justify-center items-center overflow-hidden'}>
                <UpNextItem
                    playbackId={session.playbackId}
                    mediaType={session.mediaType}
                    mediaId={session.mediaId}
                    mediaName={session.name}
                >
                    <VideoPlayer
                        source={session.source}
                        percentage={session.percentage}
                        backdrop={session.backdrop}
                        name={session.name}
                    />
                    <Controls session={session} />
                    <Listener playbackId={session.playbackId} />
                </UpNextItem>
            </div>
        );
    }

    return (
        <FullScreenTrackedComponent className={'relative w-full h-svh flex justify-center items-center overflow-hidden'}>
            <UpNextItem
                playbackId={session.playbackId}
                mediaType={session.mediaType}
                mediaId={session.mediaId}
                mediaName={session.name}
            >
                <VideoPlayer
                    source={session.source}
                    percentage={session.percentage}
                    backdrop={session.backdrop}
                    name={session.name}
                />
                <Controls session={session} />
                <Listener playbackId={session.playbackId} />
            </UpNextItem>
        </FullScreenTrackedComponent>
    );
}
