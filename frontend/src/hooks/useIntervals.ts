import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SlimMediaSchema } from '@/api/data-contracts';

type IntervalCallback = () => void;

export enum Direction {
    forward = 'forward',
    backward = 'backward',
}

export enum Position {
    current = 'current',
    previous = 'previous',
    next = 'next',
}

export interface Carousel<DataType = unknown> {
    index: number;
    active: boolean;
    onClick: () => void;
    pause: () => void;
    restart: () => void;
    isPaused: () => boolean;
    position: Position | null;
    data: DataType;
    direction: Direction;
}

interface UseCarousel<DataType> {
    current: number;
    previous: number;
    next: number;
    jumpTo: (value: number) => void;
    restart: () => void;
    pause: () => void;
    carousel: Carousel<DataType>[];
    direction: Direction;
    isPaused: () => boolean;
}

type UseCounterOptions = {
    initialValue?: number;
    targetValue: number;
    step?: number;
    duration?: number;
    onComplete?: () => void;
    autoStart?: boolean;
};

export const useInterval = (callback: IntervalCallback, delay: number | null, tick = false) => {
    const savedCallback = useRef(callback);
    const id = useRef<NodeJS.Timeout>(undefined);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) {
            return;
        }

        if (tick) {
            savedCallback.current();
        }
        id.current = setInterval(() => savedCallback.current(), delay * 1000);

        return () => id.current && clearInterval(id.current);
    }, [delay, tick]);

    const isPaused = useCallback(() => id.current === undefined, [id]);

    const clear = useCallback(() => {
        if (id.current) {
            clearInterval(id.current);
            id.current = undefined;
        }
    }, [id]);

    const restart = useCallback(() => {
        if (delay === null) {
            return;
        }

        clear();
        if (tick) {
            savedCallback.current();
        }
        id.current = setInterval(() => savedCallback.current(), delay * 1000);
    }, [clear, delay, tick]);

    return {
        clear,
        restart,
        isPaused,
    };
};

export const useTimer = () => {
    const timOut = useRef<NodeJS.Timeout>(undefined);

    const start = useCallback((callback: () => void, time: number) => {
        timOut.current = setTimeout(() => {
            callback();
        }, time);
    }, []);

    const stop = useCallback(() => {
        if (timOut.current) {
            clearTimeout(timOut.current);
        }
    }, []);

    return {
        start,
        stop,
    };
};

export const useLoop = <DataType>(array: DataType[], delay: number, initialDirection: Direction = Direction.forward): UseCarousel<DataType> => {
    const [value, setValue] = useState(0);
    const [direction, setDirection] = useState<Direction>(Direction.forward);

    const { startValue, endValue } = useMemo(() => ({
        startValue: 0,
        endValue: array.length - 1,
    }), [array]);

    const previous = useMemo(() => value === startValue ? endValue : value - 1, [value, startValue, endValue]);
    const next = useMemo(() => value === endValue ? startValue : value + 1, [value, startValue, endValue]);

    const getDirection = useCallback((index: number) => {
        if (index === startValue && value === endValue) {
            setDirection(Direction.forward);
        } else if (index === endValue && value === startValue) {
            setDirection(Direction.backward);
        } else if (index > value) {
            setDirection(Direction.forward);
        } else {
            setDirection(Direction.backward);
        }
    }, [endValue, startValue, value]);

    const { clear, restart, isPaused } = useInterval(() => {
        setValue((value) => {
            let newValue: number;

            if (value === endValue && initialDirection === Direction.forward) {
                newValue = startValue;
            } else if (value === startValue && initialDirection === Direction.backward) {
                newValue = endValue;
            } else if (initialDirection === Direction.forward) {
                newValue = value + 1;
            } else {
                newValue = value - 1;
            }

            getDirection(newValue);

            return newValue;
        });
    }, delay);

    const jumpTo = useCallback((value: number) => {
        if (value < startValue) {
            value = endValue;
        } else if (value > endValue) {
            value = startValue;
        }

        clear();
        getDirection(value);
        setValue(value);
        restart();
    }, [clear, endValue, getDirection, restart, startValue]);

    const carousel = useMemo<Carousel<DataType>[]>(() => array.map((item, index) => ({
        index,
        active: index === value,
        onClick: jumpTo.bind(null, index),
        pause: clear,
        isPaused,
        restart,
        data: item,
        direction,
        position: index === value
            ? Position.current
            : index === previous
                ? Position.previous
                : index === next
                    ? Position.next
                    : null,
    })),
    [array, clear, direction, isPaused, jumpTo, next, previous, restart, value]);

    return {
        current: value,
        previous,
        next,
        jumpTo,
        restart,
        carousel,
        pause: clear,
        direction,
        isPaused,
    };
};

export const useCounter = ({
    initialValue = 0,
    targetValue,
    step = 1,
    duration = 2,
    onComplete,
    autoStart = true,
}: UseCounterOptions) => {
    const [count, setCount] = useState(initialValue);
    const [isRunning, setIsRunning] = useState(false);

    const direction = useMemo(() => targetValue > initialValue ? 'up' : 'down'
        , [targetValue, initialValue]);

    const absStep = Math.abs(step);

    const calculateDelay = useCallback(() => {
        const totalSteps = Math.abs((targetValue - initialValue) / absStep);


        return duration / totalSteps;
    }, [duration, targetValue, initialValue, absStep]);

    const increment = useCallback(() => {
        setCount((prev) => {
            const next = direction === 'up'
                ? prev + absStep
                : prev - absStep;

            if (direction === 'up' && next >= targetValue) {
                onComplete?.();

                return targetValue;
            }
            if (direction === 'down' && next <= targetValue) {
                onComplete?.();

                return targetValue;
            }

            return next;
        });
    }, [direction, absStep, targetValue, onComplete]);

    const { clear, restart, isPaused } = useInterval(
        increment,
        isRunning ? calculateDelay() : null,
        true,
    );

    const start = useCallback(() => {
        setIsRunning(true);
        restart();
    }, [restart]);

    const pause = useCallback(() => {
        setIsRunning(false);
        clear();
    }, [clear]);

    const reset = useCallback(() => {
        setCount(initialValue);
        setIsRunning(false);
        clear();
    }, [clear, initialValue]);

    const setTo = useCallback((value: number) => {
        const boundedValue = Math.min(Math.max(value, Math.min(initialValue, targetValue)),
            Math.max(initialValue, targetValue));

        setCount(boundedValue);
    }, [initialValue, targetValue]);

    useEffect(() => {
        if (autoStart) {
            start();
        }
    }, [autoStart, start]);

    return {
        count,
        isRunning,
        start,
        pause,
        reset,
        setTo,
        isPaused,
        direction,
    };
};

export interface UseBannerOptions extends UseCounterOptions {
    duration: number;
    items: SlimMediaSchema[];
    initialDirection?: Direction;
}

export function useBanner ({ items, initialDirection = Direction.forward, ...options }: UseBannerOptions): ReturnType<typeof useCounter> & UseCarousel<SlimMediaSchema> {
    const counter = useCounter(options);
    const loop = useLoop(items, options.duration, initialDirection);

    const restart = useCallback(() => {
        counter.start();
        loop.restart();
    }, [counter.start, loop.restart]);

    const pause = useCallback(() => {
        counter.pause();
        loop.pause();
    }, [counter.pause, loop.pause]);

    const jumpTo = useCallback((value: number) => {
        counter.reset();
        counter.start();
        loop.jumpTo(value);
    }, [counter.reset, counter.start, loop.jumpTo]);

    const isPaused = useCallback(() => counter.isPaused() && loop.isPaused(), [counter.isPaused, loop.isPaused]);

    const carousel = useMemo(() => loop.carousel.map((item, index) => ({
        ...item,
        pause,
        restart,
        isPaused,
        onClick: jumpTo.bind(null, index),
    })), [loop.carousel, pause, restart, isPaused, jumpTo]);

    return {
        ...counter,
        ...loop,
        pause,
        restart,
        jumpTo,
        carousel,
        isPaused,
    };
}
