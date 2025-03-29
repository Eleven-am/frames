import { ReactNode, useMemo, useRef } from 'react';

import { motion, useScroll, useTransform } from 'framer-motion';

import { LazyImage } from '@/components/lazyImage';


export function BackgroundImage ({ backdrop, name, children }: { backdrop: string, name: string, children: ReactNode }) {
    const container = useRef<HTMLDivElement>(null);
    const target = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target,
        container,
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

    const gradient = useTransform(opacity, (o) => (`
        linear-gradient(135deg, rgba(var(--backdrop-blur), 0) ${60 - o}%, rgba(var(--dark-700), .6) ${70 - o}%, rgba(var(--dark-800), .7) ${80 - o}%, rgba(var(--dark-900), .9) ${95 - o}%),
        linear-gradient(225deg, rgba(var(--backdrop-blur), 0) ${60 - o}%, rgba(var(--dark-700), .6) ${70 - o}%, rgba(var(--dark-800), .7) ${80 - o}%, rgba(var(--dark-900), .9) ${95 - o}%)
    `));

    return (
        <div className={'hidden ipadMini:block h-screen overflow-y-scroll scrollbar-hide'} ref={container}>
            <div className={'w-full h-screen absolute top-0 left-0'}>
                <LazyImage
                    className={'w-full h-full object-cover opacity-75'}
                    loading={'eager'}
                    src={backdrop}
                    alt={name}
                />
                <motion.div className={'w-full h-full absolute top-0 left-0'}
                    style={
                        {
                            background: gradient,
                        }
                    }
                />
            </div>
            <div className={'w-full text-light-900 shadow-dark-700 text-shadow-sm pt-60 imacPro:pt-80'}>
                <div className={'w-full h-1 relative'} ref={target} />
                {children}
            </div>
        </div>
    );
}

export function BackgroundImageMobile ({ backdrop }: { backdrop: string}) {
    const holder = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: holder,
        offset: ['start start', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const height = useTransform(scrollYProgress, [0, 1], ['100%', '70%']);

    const gradient = useMemo(() => (`
        linear-gradient(135deg, rgba(var(--backdrop-blur), 0) 60%, rgba(var(--dark-760), .6) 70%, rgba(var(--dark-780), .7) 78%, rgba(var(--dark-800), .9) 90%),
        linear-gradient(225deg, rgba(var(--backdrop-blur), 0) 60%, rgba(var(--dark-760), .6) 70%, rgba(var(--dark-780), .7) 78%, rgba(var(--dark-800), .9) 90%),
        linear-gradient(to top, rgba(var(--dark-800), 1) 0%, rgba(var(--dark-780), .9) 5%, rgba(var(--dark-760), .7) 15%, rgba(var(--dark-740), .4) 25%, rgba(var(--backdrop-blur), 0) 30%)
    `), []);

    return (
        <div
            className={'w-full h-[60vh] relative top-0 left-0'}
            ref={holder}
        >
            <motion.div
                className={'w-full h-full absolute top-0 left-0'}
                style={
                    {
                        y,
                        height,
                    }
                }
            >
                <LazyImage
                    className={'w-full h-full object-cover opacity-75'}
                    loading={'eager'}
                    src={backdrop}
                    alt={''}
                />
                <div className={'absolute w-full h-full top-0 left-0'}
                    style={
                        {
                            background: gradient,
                        }
                    }
                />
            </motion.div>
        </div>
    );
}
