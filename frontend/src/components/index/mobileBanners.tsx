import { DetailedMediaSchema } from '@/api/data-contracts';
import { CarouselComponent } from '@/components/carousel';
import { MobileBanner } from '@/components/index/mobileBanner';
import { Direction, Carousel } from '@/hooks/useIntervals';

import { useScroll, useTransform, useMotionValue } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper/types';


import 'swiper/css';


interface MobileBannersProps {
    direction: Direction;
    current: number;
    jumpTo: (value: number) => void;
    duration: number;
    carousel: Carousel<(DetailedMediaSchema & { isInList: boolean })>[];
}

export function MobileBanners ({ carousel, current, jumpTo, duration }: MobileBannersProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [internalCurrent, setInternalCurrent] = useState(0);
    const [swiper, setSwiper] = useState<SwiperClass | null>(null);
    const [firstClientX, setFirstClientX] = useState(0);
    const opacity = useMotionValue(1);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });
    const height = useTransform(scrollYProgress, [0, 1], ['100%', '130%']);

    useEffect(() => {
        if (swiper && current !== swiper.activeIndex) {
            swiper.slideTo(current);
        }
    }, [current, swiper]);

    const handleSlideChange = useCallback((swiper: SwiperClass) => {
        const index = swiper.activeIndex;

        if (index !== current) {
            jumpTo(index);
        }
    }, [current, jumpTo]);

    const handleFirstMove = useCallback((swiper: SwiperClass, event: TouchEvent) => {
        setInternalCurrent(swiper.activeIndex);
        setFirstClientX(event.touches[0].clientX);
    }, []);

    const handleMove = useCallback((_swiper: SwiperClass, event: TouchEvent | MouseEvent | PointerEvent) => {
        const innerWidth = window.innerWidth;
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const direction = clientX < firstClientX ? Direction.backward : Direction.forward;
        const totalDistance = direction === Direction.forward ? innerWidth - firstClientX : firstClientX;
        const distance = direction === Direction.forward ? innerWidth - clientX : clientX;
        const progress = distance / totalDistance;

        opacity.set(progress);
    }, [firstClientX, opacity]);

    const handleTouchEnd = useCallback(() => opacity.set(1), [opacity]);

    return (
        <div className={'w-full h-[75vh] block ipadMini:hidden'} ref={ref}>
            <div className={'w-full h-full relative'}>
                <Swiper
                    className={'w-full h-full z-0'}
                    onSlideChange={handleSlideChange}
                    onTransitionEnd={handleTouchEnd}
                    onSliderFirstMove={handleFirstMove}
                    onSliderMove={handleMove}
                    onSwiper={setSwiper}
                >
                    {
                        carousel.map((element) => (
                            <SwiperSlide
                                key={element.index}
                                className={'w-full h-full pb-2'}
                            >
                                <MobileBanner
                                    isCurrent={element.index === internalCurrent}
                                    media={element.data}
                                    opacity={opacity}
                                    height={height}
                                />
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
                <CarouselComponent
                    className={'absolute bottom-0 mb-8'}
                    carousel={carousel}
                    duration={duration}
                />
            </div>
        </div>
    );
}
