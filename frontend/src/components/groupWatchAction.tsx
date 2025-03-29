import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa6';

import { MediaType } from '@/api/data-contracts';
import { BoundsContainer, BoundsElement, BoundsObstacle, BoundsProvider } from '@/components/bounds';
import { PrimaryButton } from '@/components/button';
import { LazyImage } from '@/components/lazyImage';
import { Modal } from '@/components/modal';
import { notify } from '@/components/toast';
import { SideBar } from '@/components/watch/sideBar';
import { useTimer } from '@/hooks/useIntervals';
import { useMediaLink } from '@/hooks/useMediaLink';
import { useSubscription } from '@/hooks/useSubscription';
import { DialogButtonAction, useDialogActions } from '@/providers/dialogStore';
import { useGroupWatch, useGroupWatchActions, useGroupWatchEvents } from '@/providers/groupWatch';
import { useNotificationState } from '@/providers/notificationChannel';
import { PresenceInterface } from '@/providers/realtimeNotifier';
import { useUser } from '@/providers/userProvider';
import { useBuffering } from '@/providers/watched/playerPageStates';
import { videoBridge } from '@/providers/watched/videoBridge';
import { dedupeBy } from '@/utils/arrayFunctions';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';


const tenArray = Array.from({
    length: 4,
})
    .map((_, index) => ({
        index,
    }));

export function GroupWatchAction ({ children }: { children: ReactNode }) {
    const router = useRouter();
    const isBuffering = useBuffering();
    const { start, stop } = useTimer();
    const { createDialog } = useDialogActions();
    const [display, setDisplay] = useState(false);
    const lobbyUsers = useNotificationState((state) => state.users);
    const browserId = useUser((state) => state.session?.browserId ?? '');
    const { isModalOpen, roomData, users, creatingSession, connected } = useGroupWatch();
    const { closeModal, requestSync, endSession, inviteUser, evictUser, sendSync, sendStartSession, sendBufferState } = useGroupWatchActions();

    const { link, navigateTo } = useMediaLink({
        type: roomData?.mediaType || MediaType.MOVIE,
        id: roomData?.mediaId || '',
        name: roomData?.mediaName || '',
    });

    const manageDisplay = useCallback(() => {
        stop();
        if (isModalOpen) {
            start(() => setDisplay(true), 1000);
        } else {
            setDisplay(false);
        }
    }, [isModalOpen, start, stop]);

    const handleBuffering = useCallback(() => {
        const time = videoBridge.getCurrentTime();
        const isPaused = videoBridge.getIsPaused();

        if (isPaused) {
            return;
        }

        sendBufferState(time, isBuffering);
    }, [sendBufferState, isBuffering]);

    const handleRequestSync = useCallback(() => {
        if (!connected) {
            return;
        }

        requestSync();
    }, [connected, requestSync]);

    useGroupWatchEvents('playState', ({ time, isPaused, username, browserId }) => {
        videoBridge.seek(time, false);

        if (isPaused) {
            videoBridge.pause();
        } else {
            videoBridge.play();
        }

        notify({
            title: `${isPaused ? 'Paused' : 'Resumed'} session`,
            content: `${username} has ${isPaused ? 'paused' : 'resumed'} the session`,
            browserId,
            error: false,
        });
    });

    useGroupWatchEvents('bufferState', ({ time, buffering, username, browserId }) => {
        if (!buffering) {
            if (Math.abs(videoBridge.getCurrentTime() - time) > 2) {
                videoBridge.seek(time, false);
            }

            videoBridge.play();
        }

        notify({
            title: `${buffering ? 'Poor' : 'Established'} session connection`,
            content: `${username} has ${buffering ? 'lost' : 're-established'} connection to the session`,
            browserId,
            error: buffering,
        });
    });

    useGroupWatchEvents('join', (data) => {
        if (data.browserId === browserId) {
            return;
        }

        notify({
            title: 'New user joined session',
            content: `${data.username} has joined the session ${roomData?.mediaName}`,
            browserId: data.browserId,
        });
    });

    useGroupWatchEvents('leave', (data) => {
        if (data.browserId === browserId) {
            return;
        }

        notify({
            title: 'User left session',
            content: `${data.username} has left the session ${roomData?.mediaName}`,
            browserId: data.browserId,
            error: true,
        });
    });

    useGroupWatchEvents('evicted', () => {
        notify({
            title: 'Session ended',
            content: 'You have been removed from the group watch session',
            browserId,
            error: true,
        });

        if (!roomData) {
            return router.navigate({
                to: '/',
            });
        }

        navigateTo();
    });

    useSubscription(() => router.subscribe('onBeforeLoad', () => endSession()));

    useGroupWatchEvents('sync', ({ time }) => videoBridge.setSyncTime(time));

    useGroupWatchEvents('seeked', ({ time }) => videoBridge.seek(time, false));

    useGroupWatchEvents('requestSync', () => sendSync(videoBridge.getCurrentTime()));

    useGroupWatchEvents('startSession', () => videoBridge.startSession());

    useEffect(() => handleRequestSync(), [handleRequestSync]);

    useEffect(() => handleBuffering(), [handleBuffering]);

    useEffect(() => manageDisplay(), [manageDisplay]);

    const allUsers = useMemo((): PresenceInterface[] => creatingSession ? dedupeBy(lobbyUsers.concat(users), 'browserId') : users, [creatingSession, lobbyUsers, users]);

    const checkIsInSession = useCallback((browserId: string) => users.some((user) => user.browserId === browserId), [users]);

    const handleUserClick = useCallback((item: PresenceInterface) => () => {
        const isInSession = checkIsInSession(item.browserId);

        const title = isInSession ? 'Remove from session' : 'Invite to session';
        const content = isInSession ? `Are you sure you want to remove ${item.username} from the session?` : `Would you like to invite ${item.username} to join the group watch session?`;

        const declineAction: DialogButtonAction = {
            isDestructive: isInSession,
            label: isInSession ? 'Remove' : 'Invite',
            onClick: () => {
                if (isInSession) {
                    evictUser(item);
                } else {
                    inviteUser(item);
                }
            },
        };

        const acceptAction: DialogButtonAction = {
            label: 'Cancel',
        };

        createDialog({
            title,
            content,
            acceptAction: isInSession ? acceptAction : declineAction,
            declineAction: isInSession ? declineAction : acceptAction,
        });
    }, [checkIsInSession, createDialog, evictUser, inviteUser]);

    const initiateStartSession = useCallback(() => sendStartSession(videoBridge.getCurrentTime()), [sendStartSession]);

    return (
        <>
            <SideBar>
                {children}
            </SideBar>
            <Modal
                open={isModalOpen}
                onClose={closeModal}
                style={createStyles(roomData?.backdropBlur ?? '')}
                className={'w-full h-full bg-darkD flex justify-center items-center text-lightest -z-10'}
            >
                {
                    roomData && (
                        <BoundsProvider>
                            <LazyImage
                                src={roomData.backdrop}
                                alt={roomData.mediaName}
                                className={'absolute top-0 left-0 w-full h-full object-cover opacity-30'}
                            />
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
                                            allUsers.map((item) => (
                                                <BoundsElement key={item.browserId}
                                                    id={item.browserId}
                                                    className={'absolute w-24 h-28'}
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
                                                        <div
                                                            onClick={handleUserClick(item)}
                                                            className={
                                                                tw('cursor-pointer flex w-16 h-16 justify-center items-center rounded-full bg-dark-500 shadow-md shadow-black overflow-hidden transition-all duration-300 ease-in-out', {
                                                                    'opacity-50 hover:opacity-100': !checkIsInSession(item.browserId),
                                                                })
                                                            }
                                                        >
                                                            <FaUser className={'w-8 h-8 text-light-700'} />
                                                        </div>
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
                                className={'w-fit h-fit'}
                            >
                                <BoundsObstacle
                                    id={'room-info'}
                                    className={'w-fit h-fit mt-40 space-y-4 flex flex-col justify-start items-center z-10'}
                                >
                                    <LazyImage
                                        className={'object-cover ipadMini:w-96 w-80 aspect-video rounded-lg shadow-dark-900/50 shadow-lg backdrop-blur-lg bg-black/50 group-hover:shadow-dark-900 group-hover:shadow-lg group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                                        src={roomData.poster}
                                        alt={roomData.mediaName}
                                    />
                                    <h1 className={'text-4xl text-shadow-md shadow-dark-800 font-bold text-light-900 font-frames'}>
                                        {roomData.mediaName}
                                    </h1>
                                    <div className={'flex flex-row space-x-4'}>
                                        <PrimaryButton label={'Start Session'} light onClick={initiateStartSession}>
                                            <FaPlay />
                                        </PrimaryButton>
                                        <PrimaryButton label={'End Session'} to={link.pathname} params={link.params} mask={link.mask} onClick={endSession} />
                                    </div>
                                </BoundsObstacle>
                            </motion.div>
                        </BoundsProvider>
                    )
                }
            </Modal>
        </>
    );
}
