import { SlimMediaSchema } from '@/api/data-contracts';
import { CarouselComponent } from '@/components/carousel';
import { LazyImage } from '@/components/lazyImage';
import { Carousel, Position, Direction, useLoop } from '@/hooks/useIntervals';
import { useMediaLink } from '@/hooks/useMediaLink';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

import { motion } from 'framer-motion';
import { ReactNode, useMemo, CSSProperties } from 'react';


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import ss from './Banner.module.css';

interface BannerItemProps {
    item: Carousel<SlimMediaSchema>;
    carousel: Carousel[];
    duration: number;
}

interface BannerHolderProps {
    banners: SlimMediaSchema[];
}

interface HolderProps {
    children: ReactNode;
    item: Carousel<SlimMediaSchema>;
    className?: string;
    style?: CSSProperties;
}

function Holder ({ children, item, className, style }: HolderProps) {
    const { navigateTo } = useMediaLink({
        id: item.data.id,
        type: item.data.type,
        name: item.data.name,
    });

    if (item.position === Position.current) {
        return (
            <div className={className} onClick={navigateTo} style={style}>
                {children}
            </div>
        );
    }

    return (
        <div onClick={item.onClick} className={className} style={style}>
            {children}
        </div>
    );
}

function BannerItem ({ carousel, item, duration }: BannerItemProps) {
    const { data: banner, position, direction } = item;
    const className = useMemo(() => {
        let className: string;

        switch (position) {
            case Position.current:
                className = direction === Direction.forward ? ss.second : ss.secondBack;
                break;
            case Position.previous:
                className = direction === Direction.forward ? ss.first : ss.firstBack;
                break;
            case Position.next:
                className = direction === Direction.forward ? ss.third : ss.thirdBack;
                break;
            default:
                className = '';
                break;
        }

        return className;
    }, [position, direction]);

    return (
        <Holder
            item={item}
            style={createStyles(banner.backdropBlur)}
            className={`cursor-pointer stroke-light-600 bg-dark-700 absolute w-[90vw] h-full rounded-2xl overflow-hidden flex items-center shadow-black shadow-md hover:shadow-black hover:shadow-lg hover:border-lightest hover:border-2 transition-all duration-300 ease-in-out ${className}`}
        >
            <LazyImage
                src={banner.backdrop}
                alt={banner.name}
                className={'absolute w-3/4 h-full object-cover right-0 top-0'}
            />
            <div
                className={'absolute w-full h-full top-0 left-0'}
                style={
                    {
                        background: `linear-gradient(to right, rgba(var(--dark-700), 1) 32%, rgba(var(--dark-700), .8) 42%, rgba(var(--dark-700), .2) 55%, rgba(var(--dark-700), 0)),
        linear-gradient(45deg, rgba(var(--dark-700), 1) 15%, rgba(var(--dark-700), .2) 50%, rgba(var(--dark-700), 0)),
        linear-gradient(135deg, rgba(var(--dark-700), 1) 15%, rgba(var(--dark-700), .2) 50%, rgba(var(--dark-700), 0))`,
                    }
                }
            />
            {
                position === Position.current &&
                <motion.img
                    src={banner.logo ?? ''}
                    alt={banner.name}
                    className={'w-1/4 h-36 object-contain relative ml-12'}
                    initial={
                        {
                            opacity: 0,
                            scale: 0.5,
                            y: 100,
                        }
                    }
                    animate={
                        {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }
                    }
                    transition={
                        {
                            duration: 0.5,
                            delay: 0.3,
                        }
                    }
                />
            }
            <CarouselComponent
                className={
                    tw('w-full flex flex-row justify-end items-center absolute z-10 bottom-0 p-5', {
                        hidden: position !== Position.current,
                    })
                }
                carousel={carousel}
                duration={duration}
            />
        </Holder>
    );
}

const duration = 20;

export function BannerHolder ({ banners }: BannerHolderProps) {
    const { carousel } = useLoop(banners, duration);

    if (carousel.length === 0) {
        return null;
    }

    return (
        <div className={'pt-14'}>
            <div className={'relative flex h-[50vh] items-center w-screen overflow-x-clip justify-center left-0'}>
                {
                    carousel
                        .filter((b) => b.position !== null)
                        .map((b) => (
                            <BannerItem
                                item={b}
                                key={b.data.id}
                                carousel={carousel}
                                duration={duration}
                            />
                        ))
                }
            </div>
        </div>
    );
}
