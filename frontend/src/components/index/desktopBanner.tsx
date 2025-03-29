import { useCallback } from 'react';

import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';

import { DetailedMediaSchema } from '@/api/data-contracts';
import { AddToList, InfoButton, PlayButton, TrailerButton } from '@/components/framesButtons';
import { LazyImage } from '@/components/lazyImage';
import { Player } from '@/components/player';
import { Direction } from '@/hooks/useIntervals';
import { useYoutubeActions } from '@/providers/youtubeProvider';
import { createStyles } from '@/utils/colour';


interface DesktopBannerProps {
    media: DetailedMediaSchema & { isInList: boolean };
    opacity: MotionValue<number>;
    restart: () => void;
    direction: Direction;
    pause: () => void;
}

interface CustomVariant {
    direction: Direction;
}

const variants = {
    enter: ({ direction }: CustomVariant) => ({
        x: direction === Direction.forward ? 150 : -150,
        opacity: 0,
        scale: 0.9,
    }),
    center: {
        x: 0,
        scale: 1,
        opacity: 1,
    },
    exit: ({ direction }: CustomVariant) => ({
        x: direction === Direction.forward ? -150 : 150,
        opacity: 0,
        scale: 0.9,
    }),
};

export function DesktopBanner ({ media, direction, restart, pause, opacity }: DesktopBannerProps) {
    const { destroy } = useYoutubeActions();
    const onTrailerStart = useCallback(() => pause(), [pause]);
    const onTrailerEnd = useCallback(() => restart(), [restart]);
    const onOpacityChange = useCallback(() => destroy(), [destroy]);

    useMotionValueEvent(opacity, 'change', onOpacityChange);

    return (
        <motion.div
            className={'absolute top-0 left-0 w-screen h-screen'}
            initial={'enter'}
            animate={'center'}
            exit={'exit'}
            variants={variants}
            style={createStyles(media.backdropBlur)}
            custom={
                {
                    direction,
                }
            }
            transition={
                {
                    x: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                    },
                }
            }
        >
            <Player
                name={media.name}
                onEnd={onTrailerEnd}
                onPlay={onTrailerStart}
            >
                <LazyImage
                    alt={media.name}
                    src={media.backdrop}
                    loading={'eager'}
                    className={'w-full h-full object-cover'}
                />
                <div
                    className={'w-full h-full absolute top-0 left-0 bg-gradient-to-r from-darkD/50 to-transparent'}
                />
                <div
                    className={'w-full h-full absolute top-0 left-0 bg-gradient-to-t from-darkD/20 to-transparent'}
                />
                <motion.div
                    className={'w-full absolute top-1/4 imacPro:top-1/3 h-2/3'}
                    style={
                        {
                            opacity,
                        }
                    }
                >
                    <div className={'relative mx-4 w-3/5 h-44 pointer-events-none'}>
                        <LazyImage
                            className={'absolute top-0 w-auto h-full object-contain mx-4 max-w-[50%]'}
                            loading={'eager'}
                            src={media.logo!}
                            alt={media.name}
                        />
                    </div>
                    <div
                        className={'w-4/5 m-8 text-md flex flex-row items-center gap-x-4'}
                    >
                        <PlayButton type={media.type} name={media.name} mediaId={media.id} />
                        <TrailerButton trailer={media.trailer} />
                        <AddToList data={media} mediaId={media.id} />
                        <InfoButton mediaName={media.name} mediaId={media.id} type={media.type} />
                    </div>
                    <div
                        className={'w-2/3 macbook:w-1/2 mx-8 text-md pointer-events-none text-light-900 fill-light-900 stroke-light-900 stroke-1 shadow-dark-700 text-shadow-sm'}
                    >
                        <p className={'line-clamp-4'}>
                            {media.overview}
                        </p>
                    </div>
                </motion.div>
            </Player>
        </motion.div>
    );
}
