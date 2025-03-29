import { LazyImage } from '@/components/lazyImage';
import { Carousel, useLoop, Position, useCounter } from '@/hooks/useIntervals';
import { useYoutubeActions } from '@/providers/youtubeProvider';
import { indexQueries } from '@/queries';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

import { useQuery } from '@tanstack/react-query';
import { MotionValue, motion } from 'framer-motion';
import { useCallback, useMemo, ReactNode, MouseEvent } from 'react';


interface CarouselProps {
    className: string;
    duration: number;
    carousel: Carousel[];
    carouselOpacity?: MotionValue<number>;
}

export interface CarouselItem {
    image: string;
    blur: string;
    name: string;
}

interface CarouselImagesBaseProps {
    className?: string;
    carousel: Carousel<CarouselItem>[];
}

interface CarouselImagesProps {
    items: CarouselItem[];
    className?: string;
}

interface CarouselItemProps {
    item: Carousel;
    duration: number;
    onClick: (e: MouseEvent) => void;
}

interface CarouselImagesContainerProps extends CarouselImagesProps {
    children: ReactNode;
    carouselClassName?: string;
}

interface TrendingCarouselProps {
    className?: string;
}

type TrendingContainerProps = Omit<CarouselImagesContainerProps, 'items'>;

function ActiveCarouselItem ({ item, duration }: Omit<CarouselItemProps, 'onClick'>) {
    const { count } = useCounter({
        duration,
        initialValue: 0,
        targetValue: 100,
        autoStart: item.active,
    })

    return (
        <div className={'h-[11px] w-16 bg-light-700/50 my-auto rounded-full overflow-hidden border-light-700 border-[0.25px]'}>
            <div
                className={'h-full bg-light-700 transition-all duration-500'}
                style={{
                    width: `${count}%`,
                }}
            />
        </div>
    )
}

function CarouselItem ({ item, duration, onClick }: CarouselItemProps) {
    if (!item.active) {
        return (
            <svg
                viewBox="0 0 24 24"
                className={'w-3 h-3 cursor-pointer fill-light-700/50'}
                onClick={onClick}
            >
                <circle cx="12" cy="12" r="10"/>
            </svg>
        )
    }

    return (
        <ActiveCarouselItem item={item} duration={duration} />
    )
}

export function CarouselComponent ({ className, carousel, carouselOpacity, duration }: CarouselProps) {
    const { destroy } = useYoutubeActions();

    const itemClick = useCallback((item: Carousel) => (e: MouseEvent) => {
        e.stopPropagation();
        destroy();
        item.onClick();
    }, [destroy]);

    return (
        <motion.div
            className={tw('w-full p-1 flex flex-row justify-center items-center gap-x-2', className)}
            style={
                {
                    opacity: carouselOpacity,
                }
            }
        >
            {
                carousel.map((value) => (
                    <CarouselItem
                        key={value.index}
                        item={value} duration={duration}
                        onClick={itemClick(value)}
                    />
                ))
            }
        </motion.div>
    );
}

function CarouselImagesBase ({ className, carousel }: CarouselImagesBaseProps) {
    return (
        <div className={tw('carousel', className)}>
            {
                carousel.map((item) => (
                    item.position === Position.current || item.position === Position.previous ?
                        item.position === Position.previous ?
                            <LazyImage key={item.data.image} src={item.data.image} alt={item.data.name} className={'fadeOut'} /> :
                            <LazyImage key={item.data.image} src={item.data.image} alt={item.data.name} className={'fadeIn'} /> :
                        null
                ))
            }
        </div>
    );
}

export function CarouselImages ({ items, className }: CarouselImagesProps) {
    const { carousel } = useLoop(items, 20);

    return (
        <CarouselImagesBase className={className} carousel={carousel} />
    );
}

export function TrendingCarousel ({ className }: TrendingCarouselProps) {
    const { data } = useQuery(indexQueries.trendingCarousel);

    const mappedData = useMemo(() => data
        .map((item) => ({
            image: item.poster,
            blur: item.posterBlur,
            name: item.name,
        })), [data]);

    return (
        <CarouselImages items={mappedData} className={className} />
    );
}

export function CarouselImagesContainer ({ children, items, className, carouselClassName }: CarouselImagesContainerProps) {
    const { carousel, current } = useLoop(items, 20);

    const backdropBlur = useMemo(() => carousel[current]?.data.blur ?? '', [carousel, current]);

    return (
        <div className={className} style={createStyles(backdropBlur)}>
            <CarouselImagesBase carousel={carousel} className={carouselClassName} />
            {children}
        </div>
    );
}

export function TrendingContainer ({ children, className, carouselClassName }: TrendingContainerProps) {
    const { data } = useQuery(indexQueries.trendingCarousel);

    const mappedData = useMemo(() => data
        .map((item) => ({
            image: item.poster,
            blur: item.posterBlur,
            name: item.name,
        })), [data]);

    return (
        <CarouselImagesContainer items={mappedData} className={className} carouselClassName={carouselClassName}>
            {children}
        </CarouselImagesContainer>
    );
}
