import { useCallback, useMemo, useRef, useState } from 'react';

import { motion, useMotionValue } from 'framer-motion';

import { LazyImage } from '@/components/lazyImage';
import { HoverEvent, Slider, SliderEvent } from '@/components/slider';
import { useTimer } from '@/hooks/useIntervals';
import { useProgressAndVolume } from '@/providers/watched/playerPageStates';
import { usePlayerUI } from '@/providers/watched/playerUI';
import { videoBridge } from '@/providers/watched/videoBridge';
import { toDuration } from '@/utils/helpers';


interface SliderPointerProps {
    thumbnails: any[];
    percentage: number;
    duration: number;
}

function SliderPointer ({ thumbnails, percentage, duration }: SliderPointerProps) {
    const seekingTime = useMemo(() => percentage * duration, [duration, percentage]);
    const currentArtwork = useMemo(() => thumbnails.find((thumbnail) => thumbnail.percentage >= percentage), [percentage, thumbnails]);

    if (!currentArtwork) {
        return (
            <div
                className={'absolute bottom-0 max-w-20 flex flex-col justify-center items-center pointer-events-none'}
            >
                <div
                    className={'mt-0 w-full flex justify-center mb-2 backdrop-blur-2xl border-darkM/90 border rounded-lg bg-darkM/80'}
                >
                    <span
                        className={'text-sm font-bold px-3 py-1 transition-all duration-300'}
                    >
                        {toDuration(0, seekingTime)}
                    </span>
                </div>
                <div
                    className={'absolute mt-0 bottom-0 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-darkM/90'}
                />
            </div>
        );
    }

    return (
        <div
            className={'absolute bottom-0 w-48 flex flex-col justify-center items-center pointer-events-none'}
        >
            <div
                className={'w-full bg-black flex justify-center backdrop-blur-2xl border-darkM/80 border rounded-t-lg overflow-hidden mb-0'}
            >
                <LazyImage
                    className={'w-full aspect-video object-contain my-2'}
                    src={currentArtwork.url}
                    alt={'Artwork'}
                />
            </div>
            <div
                className={'mt-0 w-full flex justify-center mb-2 backdrop-blur-2xl border-darkM/90 border rounded-b-lg bg-darkM/80'}
            >
                <span
                    className={'text-sm font-bold'}
                >
                    {toDuration(0, seekingTime)}
                </span>
            </div>
            <div
                className={'absolute mt-0 bottom-0 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-darkM/90'}
            />
        </div>
    );
}

export function ProgressBar ({ thumbnails }: { thumbnails: any[] }) {
    const displayControls = usePlayerUI((state) => state.displayControls || state.playbackBlocked);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [percentage, setPercentage] = useState(0);
    const handleX = useMotionValue(0);

    const {
        duration,
        progressCurrent,
        timeElapsed,
        timeRemaining,
        bufferedWidth,
    } = useProgressAndVolume();

    const { start, stop } = useTimer();
    const handleChange = useCallback((event: SliderEvent) => {
        stop();
        setShowTooltip(event.dragging);
        if (tooltipRef.current) {
            const tooltipWidth = tooltipRef.current.getBoundingClientRect().width / 2;

            setPercentage(event.percentage);
            handleX.set(event.progress - tooltipWidth);
        }

        start(() => {
            setShowTooltip(false);
            videoBridge.seek(event.percentage * duration);
        }, 100);
    }, [duration, handleX, start, stop]);

    const handleHover = useCallback((event: HoverEvent) => {
        setShowTooltip(event.hovering);
        if (tooltipRef.current && event.hovering) {
            const tooltipWidth = tooltipRef.current.getBoundingClientRect().width / 2;

            setPercentage(event.percentage);
            handleX.set(event.progress - tooltipWidth);
        }
    }, [handleX]);

    if (!displayControls) {
        return null;
    }

    return (
        <div
            className={'flex justify-between items-center w-full text-lightest'}
        >
            <span
                className={'pointer-events-none'}
            >
                {timeElapsed}
            </span>
            <div
                className={'flex-1 mx-2 relative flex items-center'}
            >
                <Slider
                    min={0}
                    max={1}
                    size={12}
                    fill={'#90C5F0'}
                    current={progressCurrent}
                    bufferedPosition={bufferedWidth}
                    empty={'rgba(144, 197, 240, 0.2)'}
                    bufferedColor={'rgba(144, 197, 240, 0.3)'}
                    handleChange={handleChange}
                    handleHover={handleHover}
                />
                <motion.div
                    ref={tooltipRef}
                    className={'absolute bottom-0 w-48 mb-4 flex justify-center pointer-events-none'}
                    style={
                        {
                            left: handleX,
                            opacity: showTooltip ? 1 : 0,
                        }
                    }
                >
                    <SliderPointer thumbnails={thumbnails} percentage={percentage} duration={duration} />
                </motion.div>
            </div>
            <span
                className={'pointer-events-none'}
            >
                {timeRemaining}
            </span>
        </div>
    );
}
