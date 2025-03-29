import {
    IsInListResponseSchema,
    MediaType,
    RatedStatus,
    RatingResponseSchema,
    SeenResponseSchema,
} from '@/api/data-contracts';
import { BaseButton, MotionRoundedButton, PrimaryButton, RoundedButton } from '@/components/button';
import { EditMediaDetail } from '@/components/media/editMedia';
import { PlaylistSettings } from '@/components/playlistSettings';
import { notify } from '@/components/toast';
import { useClipboard } from '@/hooks/useCipboard';
import { useHoverButton } from '@/hooks/useHoverButton';
import { useMediaLink } from '@/hooks/useMediaLink';
import { useModalHook } from '@/hooks/useModalHook';
import { useGroupWatch, useGroupWatchActions } from '@/providers/groupWatch';
import { useYoutubeActions } from '@/providers/youtubeProvider';
import { listActions } from '@/queries/list';
import { mediaActions } from '@/queries/media';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';
import { useAction } from '@eleven-am/xquery';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { CgClose } from 'react-icons/cg';
import { FaPlay } from 'react-icons/fa';
import { FaRegCopy } from 'react-icons/fa6';
import { FiHeart, FiThumbsDown, FiThumbsUp, FiUsers } from 'react-icons/fi';
import { HiPlus } from 'react-icons/hi';
import { IoIosInformationCircle } from 'react-icons/io';
import { IoCheckmark } from 'react-icons/io5';

import { LuEye, LuEyeOff, LuPencil } from 'react-icons/lu';


import { MdLibraryAdd } from 'react-icons/md';
import { SiYoutube } from 'react-icons/si';
import { TbArrowsShuffle } from 'react-icons/tb';


interface PlayDisplayButtonProps {
    display: string;
    videoId?: string;
    playlistId?: string;
    playlistVideoId?: string;
    name: string;
}

interface TypePlayButtonProps {
    mediaId: string;
    type: MediaType;
    name: string;
}

type PlayButtonProps = PlayDisplayButtonProps | TypePlayButtonProps;

interface TrailerButtonProps {
    trailer: string | null;
}

interface InfoButtonProps {
    mediaId: string;
    type: MediaType;
    mediaName: string;
    primary?: boolean;
}

interface AddToListProps {
    data: IsInListResponseSchema;
    mediaId: string;
}

interface ShufflePlayProps {
    type: MediaType;
    mediaName: string;
    mediaId: string;
}

interface MarkAsWatchedProps {
    mediaId: string;
    data: SeenResponseSchema;
}

interface RateButtonProps {
    mediaId: string;
    mediaName: string;
    data: RatingResponseSchema;
}

interface VariantProps {
    isOpened: boolean;
    direction: 'left' | 'right';
}

interface GroupWatchProps {
    mediaId: string;
}

interface ModifyMediaProps {
    backdropBlur: string;
    mediaName: string;
    mediaId: string;
    hide: boolean;
}

interface AddToPlaylistProps {
    mediaId: string;
    mediaName: string;
    backdropBlur: string;
}

interface CopyButtonProps {
    value: string;
    successMessage: string;
    errorMessage?: string;
    title: string;
}

const ratedVariants = {
    rest: {
        y: 0,
        x: 0,
        scale: 0,
    },
    open: ({ isOpened, direction }: VariantProps) => ({
        y: isOpened ? -60 : 0,
        scale: isOpened ? 1 : 0,
        x: !isOpened ? 0 : direction === 'left' ? -30 : 30,
    }),
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export function PlayButton ({ mediaId, videoId, playlistVideoId, playlistId, name, ...props }: PlayButtonProps) {
    return (
        <PrimaryButton
            light
            title={`Play ${name}`}
            label={'display' in props ? `play ${props.display}` : `play ${props.type.toLowerCase()}`}
            to={'/watch'}
            search={
                {
                    mediaId,
                    videoId,
                    playlistId,
                    playlistVideoId,
                }
            }
        >
            <FaPlay />
        </PrimaryButton>
    );
}

export function TrailerButton ({ trailer }: TrailerButtonProps) {
    const { playVideo } = useYoutubeActions();

    const onClick = useCallback(() => {
        if (trailer) {
            playVideo(trailer);
        }
    }, [trailer, playVideo]);

    if (!trailer) {
        return null;
    }

    return (
        <PrimaryButton
            onClick={onClick}
            title={'Watch Trailer'}
            label={'watch trailer'}
            aria-disabled={!trailer}
        >
            <SiYoutube className={'w-6 h-6 mr-1'} />
        </PrimaryButton>
    );
}

export function InfoButton ({ mediaId, mediaName, type, primary = false }: InfoButtonProps) {
    const { link: { params, mask, pathname } } = useMediaLink({
        id: mediaId,
        name: mediaName,
        type,
    });

    if (!primary) {
        return (
            <RoundedButton
                title={`Open ${mediaName}`}
                to={pathname}
                mask={mask}
                params={params}
            >
                <IoIosInformationCircle className={'w-6 h-6'} />
            </RoundedButton>
        );
    }

    return (
        <PrimaryButton
            title={`Open ${mediaName}`}
            label={'See details'}
            to={pathname}
            mask={mask}
            params={params}
        >
            <IoIosInformationCircle className={'w-6 h-6'} />
        </PrimaryButton>
    );
}

export function AddToList ({ data, mediaId }: AddToListProps) {
    const [hovered, setHovered] = useHoverButton();
    const { data: { isInList }, mutate } = useAction(listActions.addToList(mediaId, data));

    const icon = useMemo(() => {
        if (!isInList) {
            return <HiPlus className={'w-6 h-6'} />;
        } else if (!hovered) {
            return <IoCheckmark className={'w-6 h-6'} />;
        }

        return <CgClose className={'w-6 h-6'} />;
    }, [isInList, hovered]);

    const handleAdd = useCallback(() => mutate(!isInList), [mutate, isInList]);

    return (
        <RoundedButton
            onHover={setHovered}
            onClick={handleAdd}
            title={isInList ? 'Remove from List' : 'Add to List'}
            aria-label={isInList ? 'Remove from List' : 'Add to List'}
        >
            {icon}
        </RoundedButton>
    );
}

export function ShufflePlay ({ type, mediaName, mediaId }: ShufflePlayProps) {
    if (type !== MediaType.SHOW) {
        return null;
    }

    return (
        <RoundedButton
            title={`Shuffle play ${mediaName}`}
            to={'/watch'}
            search={
                {
                    mediaId,
                    shuffle: true,

                }
            }
        >
            <TbArrowsShuffle className={'w-6 h-6'} />
        </RoundedButton>
    );
}

export function MarkAsWatched ({ mediaId, data }: MarkAsWatchedProps) {
    const [hovered, setHovered] = useHoverButton();
    const { data: { hasSeen }, mutate } = useAction(mediaActions.markAsWatched(mediaId, data));

    const handleWatched = useCallback(() => {
        mutate(!hasSeen);
    }, [mutate, hasSeen]);

    const icon = useMemo(() => {
        if ((hasSeen && !hovered) || (!hasSeen && hovered)) {
            return <LuEye className={'w-6 h-6'} />;
        }

        return <LuEyeOff className={'w-6 h-6'} />;
    }, [hasSeen, hovered]);

    return (
        <RoundedButton
            onHover={setHovered}
            onClick={handleWatched}
            title={hasSeen ? 'Mark as Unwatched' : 'Mark as Watched'}
            aria-label={hasSeen ? 'Mark as Unwatched' : 'Mark as Watched'}
        >
            {icon}
        </RoundedButton>
    );
}

export function RateButton ({ mediaId, mediaName, data }: RateButtonProps) {
    const [isOpened, setIsOpened] = useState(false);
    const { data: { status }, mutateAsync } = useAction(mediaActions.rateMedia(mediaId, data));

    const Path = useMemo(() => {
        if (status === RatedStatus.NONE || isOpened) {
            return (
                <FiHeart className={'w-6 h-6'} />
            );
        }

        if (status === RatedStatus.POSITIVE) {
            return (
                <FiThumbsUp className={'w-6 h-6'} />
            );
        }

        return (
            <FiThumbsDown className={'w-6 h-6'} />
        );
    }, [status, isOpened]);

    const handleRate = useCallback((ratedStatus: RatedStatus) => () => {
        if (ratedStatus === status) {
            setIsOpened(false);

            return;
        }

        mutateAsync(ratedStatus)
            .finally(() => setIsOpened(false));
    }, [mutateAsync, status]);

    const handleOpenOrClose = useCallback(() => {
        if (isOpened && status !== RatedStatus.NONE) {
            mutateAsync(RatedStatus.NONE)
                .finally(() => setIsOpened(false));
        } else if (isOpened) {
            setIsOpened(false);
        } else {
            setIsOpened(true);
        }
    }, [isOpened, mutateAsync, status]);

    return (
        <div className={'relative'}>
            <RoundedButton
                noTransition
                title={status === null || isOpened ? `Rate ${mediaName}` : !status ? 'Liked it?' : 'Hated it?'}
                onClick={handleOpenOrClose}
            >
                {Path}
            </RoundedButton>
            <AnimatePresence>
                <MotionRoundedButton
                    noTransition
                    key={'rate-good'}
                    title={'Liked it?'}
                    onClick={handleRate(RatedStatus.POSITIVE)}
                    className={'absolute top-0 left-0'}
                    custom={
                        {
                            isOpened,
                            direction: 'left',
                        }
                    }
                    variants={ratedVariants}
                    initial="rest"
                    animate="open"
                >
                    <FiThumbsUp className={'w-6 h-6'} />
                </MotionRoundedButton>
                <MotionRoundedButton
                    noTransition
                    key={'rate-bad'}
                    title={'Hated it?'}
                    onClick={handleRate(RatedStatus.NEGATIVE)}
                    className={'absolute top-0 left-0'}
                    variants={ratedVariants}
                    custom={
                        {
                            isOpened,
                            direction: 'right',
                        }
                    }
                    initial="rest"
                    animate="open"
                >
                    <FiThumbsDown className={'w-6 h-6'} />
                </MotionRoundedButton>
            </AnimatePresence>
        </div>
    );
}

export function GroupWatch ({ mediaId }: GroupWatchProps) {
    const isConnected = useGroupWatch((state) => state.connected);
    const { createRoomFromMedia } = useGroupWatchActions();

    const handleCreateGroupWatch = useCallback(() => createRoomFromMedia(mediaId), [createRoomFromMedia, mediaId]);

    return (
        <RoundedButton
            title={'Group Watch'}
            aria-label={'Group Watch'}
            onClick={handleCreateGroupWatch}
            className={
                tw({
                    'bg-green-800 hover:bg-green-900': isConnected,
                })
            }
        >
            <FiUsers className={'w-6 h-6'} />
        </RoundedButton>
    );
}

export function ModifyMedia ({ mediaName, hide, mediaId, backdropBlur }: ModifyMediaProps) {
    const { isOpen, openModal, closeModal } = useModalHook();

    if (hide) {
        return null;
    }

    return (
        <>
            <RoundedButton
                title={`Modify ${mediaName}`}
                onClick={openModal}
            >
                <LuPencil className={'w-6 h-6'} />
            </RoundedButton>
            <EditMediaDetail mediaId={mediaId} open={isOpen} onClose={closeModal} backdropBlur={backdropBlur} />
        </>
    );
}

export function AddToPlaylist ({ mediaId, mediaName, backdropBlur }: AddToPlaylistProps) {
    const { isOpen, openModal, closeModal } = useModalHook();

    return (
        <>
            <RoundedButton
                title={'Add to a Playlist'}
                onClick={openModal}
            >
                <MdLibraryAdd className={'w-6 h-6'} />
            </RoundedButton>
            <PlaylistSettings
                style={createStyles(backdropBlur, [5], true)}
                className={'bg-dark-500/70'}
                onClose={closeModal}
                mediaId={mediaId}
                name={mediaName}
                open={isOpen}
            />
        </>
    );
}

export function CopyButton ({ value, successMessage, title, errorMessage }: CopyButtonProps) {
    const { copy } = useClipboard();

    const handleClick = useCallback(() => {
        if (errorMessage) {
            notify({
                title: 'Copy Failed',
                content: errorMessage,
                browserId: 'clipboard',
                error: true,
            });

            return;
        }
        copy(value, successMessage);
    }, [errorMessage, copy, value, successMessage]);

    return (
        <BaseButton
            title={title}
            onClick={handleClick}
            className={'cursor-pointer'}
        >
            <FaRegCopy className={'w-5 h-5'} />
        </BaseButton>
    );
}
