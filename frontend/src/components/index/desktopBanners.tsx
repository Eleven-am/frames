import { DetailedMediaSchema } from '@/api/data-contracts';
import { CarouselComponent } from '@/components/carousel';
import { DesktopBanner } from '@/components/index/desktopBanner';
import { Carousel, Direction, Position } from '@/hooks/useIntervals';
import { AnimatePresence, MotionValue, motion, useTransform, useMotionValueEvent } from 'framer-motion';

interface DesktopBannersProps {
    carousel: Carousel<(DetailedMediaSchema & { isInList: boolean })>[];
    scrollYProgress: MotionValue<number>;
    pause: () => void;
    restart: () => void;
    isPaused: () => boolean;
    direction: Direction;
    duration: number;
}

export function DesktopBanners ({ carousel, scrollYProgress, pause, restart, isPaused, direction, duration }: DesktopBannersProps) {
    const imageOpacity = useTransform(scrollYProgress, [0.5, 0.9], [1, 0]);
    const itemsOpacity = useTransform(scrollYProgress, [0.2, 0.45], [1, 0]);
    const carouselOpacity = useTransform(scrollYProgress, [0.26, 0.3], [1, 0]);

    useMotionValueEvent(itemsOpacity, 'change', (value) => {
        if (value <= 0.2) {
            pause();
        } else if (isPaused()) {
            restart();
        }
    });

    return (
        <motion.div
            className={'fixed top-0 left-0 w-full h-full hidden ipadMini:block'}
            style={
                {
                    opacity: imageOpacity,
                }
            }
        >
            <AnimatePresence
                initial={false}
                custom={
                    {
                        direction,
                    }
                }
            >
                {
                    carousel.map((element) => element.position === Position.current && (
                        <DesktopBanner
                            key={element.data.id}
                            media={element.data}
                            direction={direction}
                            restart={element.restart}
                            pause={element.pause}
                            opacity={itemsOpacity}
                        />
                    ))
                }
            </AnimatePresence>
            <CarouselComponent
                className={'fixed z-10 mt-[75vh]'}
                carousel={carousel}
                carouselOpacity={carouselOpacity}
                duration={duration}
            />
        </motion.div>
    );
}
