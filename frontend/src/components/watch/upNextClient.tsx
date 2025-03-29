import { ReactNode, useCallback, useEffect } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';

import { PlayButton } from '@/components/framesButtons';
import { useCountdown } from '@/providers/watched/playerPageStates';
import { usePlayerSessionActions } from '@/providers/watched/playerSession';
import { watchMutations } from '@/queries/watch';
import { tw } from '@/utils/style';


interface UpNextPlayButtonProps {
    videoId: string;
    playbackId: string;
    playlistVideoId: string | null;
    name: string;
}

const variants = {
    shrink: {
        width: '30%',
        height: '30%',
        transformOrigin: 'right top',
        boxShadow: '0px 31px 21px -19px rgba(0,0,0,0.9)',
        WebkitBoxShadow: '0px 31px 21px -19px rgba(0,0,0,0.9)',
        marginTop: '2%',
        marginRight: '2%',
    },
    expand: {
        transformOrigin: 'right top',
        marginTop: 0,
        marginRight: 0,
    },
};

export function UpNextPlayButton ({ videoId, playlistVideoId, name, playbackId }: UpNextPlayButtonProps) {
    const router = useRouter();
    const { mutate } = useMutation(watchMutations.saveProgress(playbackId));
    const { display, shrunk, currentTime } = useCountdown((state) => ({
        display: state?.display ?? '',
        shrunk: Boolean(state),
        currentTime: state?.difference ?? -1,
    }));

    const navigate = useCallback(async () => {
        if (shrunk && currentTime <= 1) {
            mutate(100);

            await router.navigate({
                to: '/watch',
                search: {
                    playlistVideoId: playlistVideoId ?? undefined,
                    videoId: playlistVideoId ? undefined : videoId,
                },
            });
        }
    }, [currentTime, mutate, playlistVideoId, router, shrunk, videoId]);

    useEffect(() => void navigate(), [navigate]);

    return (
        <PlayButton
            display={display}
            playlistVideoId={playlistVideoId ?? undefined}
            videoId={videoId}
            name={name}
        />
    );
}

export function UpNextWrapper ({ children }: { children: ReactNode }) {
    const shrunk = useCountdown((state) => Boolean(state));
    const { setAutoPlay } = usePlayerSessionActions();

    const handleCLick = useCallback(() => {
        if (shrunk) {
            void setAutoPlay(false);
        }
    }, [setAutoPlay, shrunk]);

    return (
        <AnimatePresence initial={false}>
            <motion.div
                className={
                    tw('absolute w-full h-full top-0 right-0 flex justify-center items-center overflow-hidden', {
                        'rounded-lg cursor-pointer': shrunk,
                    })
                }
                initial="expand"
                animate={shrunk ? 'shrink' : 'expand'}
                exit="expand"
                variants={variants}
                onClick={handleCLick}
                transition={
                    {
                        type: 'tween',
                        ease: 'linear',
                        duration: 0.5,
                    }
                }
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
