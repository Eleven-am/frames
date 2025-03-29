import { ReactNode, useState, useCallback, CSSProperties } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { FaPlay, FaPause } from 'react-icons/fa';
import { IoArrowBackOutline } from 'react-icons/io5';

import { RoundedButton } from '@/components/button';
import { useEventListener } from '@/hooks/useEventListener';
import { useTimer } from '@/hooks/useIntervals';
import { useYoutubeActions, useYoutubeState, useYoutubeEvents } from '@/providers/youtubeProvider';
import { tw } from '@/utils/style';


interface PlayerProps {
    name: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onPlay?: () => void;
    onEnd?: () => void;
}

const variants = {
    player: (isPlaying: boolean) => ({
        opacity: isPlaying ? 1 : 0,
        display: isPlaying ? 'block' : 'none',
        scale: isPlaying ? 1 : 0.9,
    }),
    holder: (isPlaying: boolean) => ({
        opacity: isPlaying ? 0 : 1,
        display: isPlaying ? 'none' : 'block',
        scale: isPlaying ? 0.9 : 1,
    }),
};

export function Player ({ name, children, onPlay, onEnd, className, style }: PlayerProps) {
    const { start, stop } = useTimer();
    const [hideControls, setHideControls] = useState<boolean>(false);
    const { togglePlay: playPause, destroy, setHolder } = useYoutubeActions();
    const { isPlaying, startedPlaying } = useYoutubeState((state) => ({
        isPlaying: state.playerState === 1,
        startedPlaying: state.startedPlaying,
    }));

    const manageTimer = useCallback(() => {
        setHideControls(false);
        stop();
        start(() => {
            setHideControls(true);
        }, 3000);
    }, [start, stop]);

    const togglePlay = useCallback(() => {
        playPause();
        manageTimer();
    }, [manageTimer, playPause]);

    const destroyPlayer = useCallback(() => {
        destroy();
    }, [destroy]);

    const ref = useCallback((ref: HTMLDivElement | null) => {
        if (ref) {
            setHolder(ref);
        }
    }, [setHolder]);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        }
        manageTimer();
    });

    useYoutubeEvents('ended', () => {
        onEnd?.();
    });

    useYoutubeEvents('play', () => {
        manageTimer();
        onPlay?.();
    });

    useEventListener('mousemove', manageTimer);

    return (
        <div className={tw('relative w-full h-full', className)} style={style}>
            <AnimatePresence
                mode={'popLayout'}
                initial={false}
            >
                <motion.div
                    variants={variants}
                    custom={startedPlaying}
                    className={'scrollbar-hide w-full h-full'}
                    animate={'holder'}
                    key={'holder'}
                    transition={
                        {
                            duration: 0.3,
                        }
                    }
                >
                    {children}
                </motion.div>
                <motion.div
                    className={
                        tw('fixed w-full h-full top-0 left-0 bg-black', {
                            'pointer-events-none': !startedPlaying,
                        })
                    }
                    variants={variants}
                    custom={startedPlaying}
                    animate={'player'}
                    transition={
                        {
                            duration: 0.3,
                        }
                    }
                    key={'player'}
                >
                    <div
                        ref={ref}
                        className={'top-0 left-0 w-full h-full object-contain pointer-events-none'}
                    />
                    <div
                        className={
                            tw('absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-white text-2xl transition-all duration-300', {
                                'opacity-0': hideControls,
                                'opacity-100': !hideControls,
                            })
                        }
                    >
                        <RoundedButton
                            onClick={togglePlay}
                            title={isPlaying ? 'Pause' : 'Play'}
                            className={'w-20 h-20 scale-125 hover:scale-150'}
                        >
                            {
                                !isPlaying
                                    ? <FaPlay className={'w-6 h-6'} />
                                    : <FaPause className={'w-6 h-6'} />
                            }
                        </RoundedButton>
                        <div
                            className={'absolute top-0 w-full left-0 flex justify-start items-center px-5 py-10 text-shadow-lg bg-gradient-to-b from-darkD/60'}
                        >
                            <RoundedButton
                                onClick={destroyPlayer}
                                title={'Close Player'}
                            >
                                <IoArrowBackOutline className={'w-6 h-6'} />
                            </RoundedButton>
                            <span>
                                <h1 className={'mx-4 text-2xl font-bold'}>{name}</h1>
                            </span>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
