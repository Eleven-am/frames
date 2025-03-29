import { useResizeObserver } from '@/hooks/useResizeObserver';
import { clamp } from '@/utils/helpers';

import { animate, motion, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';


export interface SliderEvent {
    progress: number;
    percentage: number;
    dragging: boolean;
}

export interface HoverEvent {
    progress: number;
    percentage: number;
    hovering: boolean;
}

interface SliderProps {
    handleChange: (event: SliderEvent) => void;
    handleHover?: (event: HoverEvent) => void;
    size: number;
    current: number;
    max: number;
    min: number;
    fill: string;
    empty: string;
    bufferedColor?: string;
    bufferedPosition?: number;
}

export function Slider ({
    min,
    max,
    current,
    handleChange,
    handleHover,
    size,
    fill,
    empty,
    bufferedColor,
    bufferedPosition = 0,
}: SliderProps) {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const progressBarHandleRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const handleX = useMotionValue(0);
    const progress = useTransform(handleX, (v) => v + (size / 2));
    const [ref, bounds] = useResizeObserver<HTMLDivElement>();

    const handleDrag = useCallback(() => {
        if (progressBarHandleRef.current && progressBarRef.current) {
            const bounds = progressBarHandleRef.current.getBoundingClientRect();
            const { left, width } = progressBarRef.current.getBoundingClientRect();

            const middleOfHandle = bounds.left + (bounds.width / 2);
            const newPercentage = (middleOfHandle - left) / width;
            const newProgress = (newPercentage * width) + (size / 2);

            handleChange({
                progress: newProgress,
                percentage: clamp(newPercentage, 0, 1),
                dragging: true,
            });
        }
    }, [handleChange, size]);

    const calculateHandlePosition = useCallback(() => {
        if (progressBarRef.current) {
            const newPercentage = current / (max - min);
            const bounds = progressBarRef.current.getBoundingClientRect();
            const handlePosition = bounds.width * newPercentage;

            handleX.set(handlePosition);
        }
    }, [current, handleX, max, min]);

    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (progressBarRef.current) {
            const { left, width } = progressBarRef.current.getBoundingClientRect();
            const position = event.clientX - left;
            const newPercentage = clamp(position / width, 0, 1);
            const newProgress = (newPercentage * width) + (size / 2);

            animate(handleX, newProgress);
            handleChange({
                progress: newProgress,
                percentage: newPercentage,
                dragging: false,
            });
        }
    }, [handleChange, handleX]);

    const handleMouseMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (progressBarRef.current && handleHover) {
            const { left, width } = progressBarRef.current.getBoundingClientRect();
            const position = event.clientX - left;
            const newPercentage = clamp(position / width, 0, 1);
            const newProgress = (newPercentage * width) + (size / 2);
 
            handleHover({
                progress: newProgress,
                percentage: newPercentage,
                hovering: true,
            });
        }
    }, [handleHover]);

    const handleMouseLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (progressBarRef.current && handleHover) {
            const { left, width } = progressBarRef.current.getBoundingClientRect();
            const position = event.clientX - left;
            const newPercentage = clamp(position / width, 0, 1);
            const newProgress = (newPercentage * width) + (size / 2);

            handleHover({
                progress: newProgress,
                percentage: newPercentage,
                hovering: false,
            });
        }
    }, [handleHover]);

    useEffect(() => calculateHandlePosition(), [calculateHandlePosition, bounds]);
    const manageDragging = useCallback((isDragging: boolean) => () => setIsDragging(isDragging), []);
    const background = useMotionTemplate`linear-gradient(to right, ${fill} ${progress}px, ${empty} 0)`;

    return (
        <div className={'w-full relative flex items-center'} ref={ref}>
            {
                bufferedPosition > 0 && (
                    <div
                        className={'absolute h-1 rounded-full pointer-events-none'}
                        style={
                            {
                                background: bufferedColor,
                                width: `${bufferedPosition * 100}%`,
                            }
                        }
                    />
                )
            }
            <motion.div
                className={'absolute h-1 rounded-full w-full cursor-pointer'}
                ref={constraintsRef}
                style={
                    {
                        background,
                    }
                }
            />
            <div
                className={'absolute'}
                ref={progressBarRef}
                style={
                    {
                        left: size / 2,
                        right: size / 2,
                    }
                }
            />
            <div
                className={'absolute h-4 w-full cursor-pointer'}
                onPointerDown={handlePointerDown}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
            <motion.div
                className={'relative bg-white rounded-full cursor-pointer'}
                dragConstraints={constraintsRef}
                ref={progressBarHandleRef}
                dragMomentum={false}
                onDrag={handleDrag}
                onDragStart={manageDragging(true)}
                onDragEnd={manageDragging(false)}
                onPointerDown={manageDragging(true)}
                onPointerUp={manageDragging(false)}
                animate={
                    {
                        scale: isDragging ? 2 : 1,
                    }
                }
                dragElastic={0}
                drag={'x'}
                style={
                    {
                        x: handleX,
                        width: size,
                        height: size,
                    }
                }
            />
        </div>
    );
}
