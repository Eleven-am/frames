import { LazyImage } from '@/components/lazyImage';
import { usePlayerUI } from '@/providers/watched/playerUI';
import { useVideoManagerActions } from '@/providers/watched/videoManager';

interface VideoPlayerProps {
    percentage: number;
    name: string;
    backdrop: string;
    source: string;
}

interface PosterImageProps {
    mediaName: string;
    mediaBackdrop: string;
}

function PosterImage ({ mediaName, mediaBackdrop }: PosterImageProps) {
    const hasLoaded = usePlayerUI((state) => state.started);

    if (hasLoaded) {
        return null;
    }

    return (
        <>
            <LazyImage
                alt={mediaName}
                loading={'eager'}
                src={mediaBackdrop}
                className={'absolute w-full h-full object-cover'}
            />
            <div className={'fixed top-0 left-0 w-full h-full bg-darkD/20'} />
        </>
    );
}

export function VideoPlayer ({ percentage, name, backdrop, source }: VideoPlayerProps) {
    const { setVideo } = useVideoManagerActions();

    return (
        <>
            <video
                preload={'metadata'}
                ref={setVideo(source, percentage)}
                className={'relative w-full h-full object-contain object-center bg-black'}
            />
            <PosterImage mediaName={name} mediaBackdrop={backdrop} />
        </>
    );
}
