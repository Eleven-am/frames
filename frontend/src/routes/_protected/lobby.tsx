import { useCallback, useEffect, useMemo, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa6';

import { BoundsContainer, BoundsElement, BoundsObstacle, BoundsProvider } from '@/components/bounds';
import { PrimaryButton } from '@/components/button';
import { TrendingContainer } from '@/components/carousel';
import { ErrorClient } from '@/components/errorClient';
import { HoverElement, useOnHover } from '@/components/hoverElement';
import { LazyImage } from '@/components/lazyImage';
import { Metadata } from '@/components/metadata';
import { useTimer } from '@/hooks/useIntervals';
import { useGroupWatchActions } from '@/providers/groupWatch';
import { useNotificationState } from '@/providers/notificationChannel';


const tenArray = Array.from({
    length: 4,
})
    .map((_, index) => ({
        index,
    }));

function LobbyComponent () {
    const { users } = useNotificationState();
    const { start, stop } = useTimer();
    const [display, setDisplay] = useState(false);
    const { start: startHover, stop: stopHover } = useTimer();
    const [browserId, setBrowserId] = useState<string | null>(null);
    const { createRoomFromMedia, createRoomFromPlayback, inviteUser } = useGroupWatchActions();

    useEffect(() => {
        stop();
        start(() => setDisplay(true), 1000);
    }, [start, stop]);

    const handleHover = useCallback((browserId: string) => (hovered: boolean) => {
        stopHover();
        if (hovered) {
            setBrowserId(browserId);
        } else {
            startHover(() => setBrowserId(null), 1000);
        }
    }, [startHover, stopHover]);

    const props = useOnHover<HTMLDivElement>((hovered: boolean) => {
        stopHover();
        if (!hovered) {
            startHover(() => setBrowserId(null), 1000);
        }
    });

    const hoveredUser = useMemo(() => users.find((item) => item.browserId === browserId), [browserId, users]);

    const startSession = useCallback(async () => {
        if (!hoveredUser || !hoveredUser.metadata) {
            return;
        }

        let roomId: string | undefined;

        if (hoveredUser.metadata.playbackId) {
            roomId = await createRoomFromPlayback(hoveredUser.metadata.playbackId);
        } else {
            roomId = await createRoomFromMedia(hoveredUser.metadata.mediaId);
        }

        if (roomId) {
            inviteUser(hoveredUser);
        }
    }, [createRoomFromMedia, createRoomFromPlayback, hoveredUser, inviteUser]);

    return (
        <TrendingContainer className={'w-screen h-screen flex items-center justify-center'}>
            <Metadata title={'Lobby'} />
            <BoundsProvider>
                {
                    tenArray.map(({ index }) => (
                        <motion.div
                            key={index}
                            animate={
                                {
                                    scale: [0.5, index * 0.5],
                                    opacity: [0, 0.3],
                                }
                            }
                            transition={
                                {
                                    duration: 2 + (index * 0.5),
                                    repeatType: 'reverse',
                                    repeat: Infinity,
                                    delay: index * 0.5,
                                    ease: 'easeInOut',
                                }
                            }
                            className={'w-[48rem] h-[48rem] absolute rounded-full bg-light-400'}
                        />
                    ))
                }
                <BoundsContainer className={'w-[48rem] h-[48rem] absolute rounded-full'}>
                    <div className={'relative w-full h-full'}>
                        {
                            display && (
                                users.map((item) => (
                                    <BoundsElement
                                        key={item.browserId}
                                        id={item.browserId}
                                        className={'absolute w-24 h-24'}
                                    >
                                        <motion.div
                                            className={'relative w-full h-full flex flex-col justify-center items-center space-y-2'}
                                            initial={
                                                {
                                                    opacity: 0,
                                                    scale: 0,
                                                }
                                            }
                                            animate={
                                                {
                                                    opacity: 1,
                                                    scale: 1,
                                                }
                                            }
                                            transition={
                                                {
                                                    duration: 0.5,
                                                }
                                            }
                                        >
                                            <HoverElement
                                                element={'div'}
                                                onHover={handleHover(item.browserId)}
                                                className={'flex w-16 h-16 justify-center items-center rounded-full bg-dark-500 cursor-pointer shadow-md shadow-black overflow-hidden'}
                                            >
                                                <FaUser className={'w-8 h-8 text-light-700'} />
                                            </HoverElement>
                                            <span className={'text-sm font-semibold text-shadow-sm text-light-700'}>
                                                {item.username}
                                            </span>
                                        </motion.div>
                                    </BoundsElement>
                                ))
                            )
                        }
                    </div>
                </BoundsContainer>
                <motion.div
                    initial={
                        {
                            opacity: 0,
                            y: 100,
                        }
                    }
                    animate={
                        {
                            opacity: 1,
                            y: 0,
                        }
                    }
                    transition={
                        {
                            duration: 0.5,
                            delay: 0.2,
                        }
                    }
                    className={'w-full flex justify-center'}
                    {...props}
                >
                    <AnimatePresence mode={'popLayout'}>
                        <BoundsObstacle
                            id={'room-info'}
                            className={'w-1/3 h-2/5 mt-40 flex justify-center items-center'}
                        >
                            {
                                hoveredUser?.metadata && (
                                    <motion.div
                                        className={'w-full h-full flex flex-col justify-center items-center space-y-4'}
                                        initial={
                                            {
                                                opacity: 0,
                                                scale: 0.75,
                                            }
                                        }
                                        animate={
                                            {
                                                opacity: 1,
                                                scale: 1,
                                            }
                                        }
                                        exit={
                                            {
                                                opacity: 0,
                                                scale: 0.75,
                                            }
                                        }
                                        transition={
                                            {
                                                duration: 0.1,
                                            }
                                        }
                                    >
                                        <LazyImage
                                            className={'object-cover ipadMini:w-96 w-80 aspect-video rounded-lg shadow-dark-900/50 shadow-lg backdrop-blur-lg bg-black/50 group-hover:shadow-dark-900 group-hover:shadow-lg group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                                            src={hoveredUser.metadata.poster}
                                            alt={hoveredUser.metadata.name}
                                        />
                                        <h1 className={'text-4xl text-shadow-md shadow-dark-800 font-bold text-light-900 font-frames z-50 text-center line-clamp-2'}>
                                            {hoveredUser.metadata.name}
                                        </h1>
                                        <h2 className={'text-md text-center text-shadow-sm w-full line-clamp-2 shadow-dark-800 font-semibold text-light-900 z-50'}>
                                            {hoveredUser.metadata.overview}
                                        </h2>
                                        <div className={'flex flex-row space-x-4'}>
                                            <PrimaryButton
                                                label={'Start Session'}
                                                onClick={startSession}
                                                light
                                            >
                                                <FaPlay />
                                            </PrimaryButton>
                                        </div>
                                    </motion.div>
                                )
                            }
                        </BoundsObstacle>
                    </AnimatePresence>
                </motion.div>
            </BoundsProvider>
        </TrendingContainer>
    );
}

export const Route = createFileRoute('/_protected/lobby')({
    component: LobbyComponent,
    errorComponent: ({ error }) => (
        <ErrorClient
            title={'Something went wrong'}
            message={(error as Error).message}
        />
    ),
});
