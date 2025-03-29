import { Role } from '@/api/data-contracts';
import { HoverElement } from '@/components/hoverElement';
import { Modal } from '@/components/modal';
import { PlaylistSettings } from '@/components/playlistSettings';
import { InputGroup } from '@/components/setup/input';
import { Slider, SliderEvent } from '@/components/slider';
import { notify } from '@/components/toast';
import { PlayerButton } from '@/components/watch/playerButton';
import { useClipboard } from '@/hooks/useCipboard';
import { useModalHook, ModalHook } from '@/hooks/useModalHook';
import { useAuthStore, useAuthStoreActions } from '@/providers/authStore';
import { useDialogActions } from '@/providers/dialogStore';
import { useGroupWatch } from '@/providers/groupWatch';
import { useUser } from '@/providers/userProvider';
import { airplayManager, chromecastManager, Provider, useCastSelector } from '@/providers/watched/castManager';
import { useProgressAndVolume } from '@/providers/watched/playerPageStates';
import { usePlayerUI, usePlayerUIActions } from '@/providers/watched/playerUI';
import { videoBridge } from '@/providers/watched/videoBridge';
import { watchMutations } from '@/queries/watch';
import { getBaseUrl, generateRandomCypher } from '@/utils/helpers';
import { tw } from '@/utils/style';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState, useMemo } from 'react';
import { FaChromecast } from 'react-icons/fa';
import { FiAirplay, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { IoShareOutline } from 'react-icons/io5';
import { MdLibraryAdd, MdDownloadForOffline } from 'react-icons/md';


interface DownloadButtonProps {
    playbackId: string;
    lockLeft: LockLeft;
    name: string;
    episodeName: string | null
}

interface LeftControlsProps {
    mediaId: string;
    videoId: string;
    playbackId: string;
    name: string;
    episodeName: string | null;
}

interface AddToPlaylistButtonProps {
    name: string;
    mediaId: string;
    videoId: string;
    lockLeft: LockLeft;
}

interface ShareButtonProps {
    name: string;
    episodeName: string | null;
    playbackId: string;
}

type LockLeft = (lock: ModalHook) => ModalHook;

function CastButton () {
    const { available, connected, provider } = useCastSelector();

    const connect = useCallback(() => {
        if (available) {
            if (chromecastManager.isAvailable()) {
                // const currentTime = videoBridge.getCurrentTime();
                // const customData = playerSession.getCustomData();

                // chromecastManager.cast(currentTime, customData);
            } else if (airplayManager.isAvailable()) {
                airplayManager.connect();
            }
        }
    }, [available]);

    if (!available) {
        return null;
    }

    return (
        <PlayerButton
            onClick={connect}
            isActivated={connected}
            title={connected ? `Connected to ${provider}` : 'Cast'}
        >
            <>
                {
                    provider === Provider.CHROMECAST &&
                    <FaChromecast strokeWidth={2} className={'w-8 h-8'} />
                }
                {
                    provider === Provider.AIRPLAY &&
                    <FiAirplay strokeWidth={2} className={'w-8 h-8'} />
                }
            </>
        </PlayerButton>
    );
}

function ShareButton ({ name, playbackId, episodeName }: ShareButtonProps) {
    const { copy } = useClipboard();
    const { createDialog } = useDialogActions();
    const [cypher, setCypher] = useState(generateRandomCypher());
    const url = useMemo(() => `${getBaseUrl()}/f=${cypher}`, [cypher]);
    const isGuest = useUser(state => state.session?.role === Role.GUEST);
    const percentage = useProgressAndVolume(state => state.percentage);
    const { mutate } = useMutation(watchMutations.shareVideo(playbackId, cypher));

    const performAction = useCallback((percentage: number) => () => {
        copy(url, 'Link copied to clipboard');
        mutate(percentage);
        setCypher(generateRandomCypher());
    }, [copy, mutate, url]);

    const handleClick = useCallback(() => {
        if (isGuest) {
            notify({
                title: 'Unauthorized',
                browserId: 'share-video',
                content:'Guest users are not authorized to create frames.',
                error: true,
            })

            return;
        }

        createDialog({
            title: `Share ${name}`,
            content: `Create a frame to share ${name}${episodeName ? ` - ${episodeName}` : ''}`,
            acceptAction: {
                label: 'Share',
                onClick: () => createDialog({
                    title: 'Shared position',
                    content: 'Would you like to share the current position of the video or the beginning?',
                    acceptAction: {
                        label: 'Current position',
                        onClick: performAction(percentage),
                    },
                    declineAction: {
                        label: 'Beginning',
                        onClick: performAction(0),
                    },
                })
            }
        });
    }, [performAction, percentage, name, createDialog, isGuest]);

    return (
        <PlayerButton
            onClick={handleClick}
            title={`Share ${name}`}
            disabled={isGuest}
        >
            <IoShareOutline className={'w-8 h-8'} />
        </PlayerButton>
    );
}

function AddToPlaylistButton ({ name, mediaId, videoId, lockLeft }: AddToPlaylistButtonProps) {
    const modalHook = useModalHook();
    const { isOpen, openModal, closeModal } = useMemo(() => lockLeft(modalHook), [lockLeft, modalHook]);

    return (
        <>
            <PlayerButton
                onClick={openModal}
                title={'Add to playlist'}
            >
                <MdLibraryAdd className={'w-8 h-8'} />
            </PlayerButton>
            <PlaylistSettings
                onClose={closeModal}
                mediaId={mediaId}
                videoId={videoId}
                open={isOpen}
                name={name}
            />
        </>
    );
}

function VolumeSlider () {
    const { volume, muted } = useProgressAndVolume((state) => ({
        volume: state.volume,
        muted: state.muted,
    }));

    const handleChange = useCallback((event: SliderEvent) => {
        videoBridge.setVolume(event.percentage);
    }, []);

    const handleClick = useCallback(() => {
        videoBridge.muteOrUnmute();
    }, []);

    return (
        <div
            className={'h-full w-44 flex justify-around items-center mx-2 gap-x-2'}
        >
            <PlayerButton
                onClick={handleClick}
                title={muted ? 'Unmute' : 'Mute'}
                isDeactivated={muted}
            >
                {
                    muted ?
                        <FiVolumeX className={'w-8 h-8 fill-current'} /> :
                        <FiVolume2 className={'w-8 h-8 fill-current'} />
                }
            </PlayerButton>
            <Slider
                min={0}
                max={1}
                size={12}
                current={volume}
                handleChange={handleChange}
                empty={'rgba(144, 197, 240, 0.2)'}
                fill={`${muted ? '#EF4444' : '#90C5F0'}`}
            />
        </div>
    );
}

function DownloadButton ({ playbackId, lockLeft, name, episodeName }: DownloadButtonProps) {
    const modalHook = useModalHook();
    const { setAuthKey } = useAuthStoreActions();
    const valid = useAuthStore((state) => state.authKey.authKeyValid);
    const { isOpen, openModal, closeModal } = useMemo(() => lockLeft(modalHook), [lockLeft, modalHook]);
    const { mutate } = useMutation(watchMutations.downloadVideo(playbackId, closeModal));

    return (
        <>
            <PlayerButton
                title={'Download'}
                onClick={openModal}
            >
                <MdDownloadForOffline className={'w-8 h-8'} />
            </PlayerButton>
            <Modal
                open={isOpen}
                onClose={closeModal}
                className={'flex flex-col items-center justify-start overflow-hidden overflow-y-scroll scrollbar-hide gap-y-6 py-4 w-1/3 fullHD:w-1/3 h-2/5 px-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <InputGroup<{ authKey: string }>
                    noAnimationOnEnter
                    label={'Download'}
                    handleSubmit={({ authKey }) => mutate(authKey)}
                    description={'Enter an auth key to download the video. Please note that the subsequent download link will be valid for 5 hours.'}
                    submitButton={{
                        isDisabled: !valid,
                        label: 'Download the video',
                        tooltip: `Download ${name}${episodeName ? ` - ${episodeName}` : ''}`,
                    }}
                    inputs={
                        [
                            {
                                maxLength: 24,
                                name: 'authKey',
                                isValueValid: valid,
                                placeholder: 'Enter an auth key',
                                validate: async (value) => (await setAuthKey(value)) === null,
                            },
                        ]
                    }
                />
            </Modal>
        </>
    );
}

export function LeftControls ({ name, mediaId, videoId, playbackId, episodeName }: LeftControlsProps) {
    const [hovered, setHovered] = useState(false);
    const { openLeftModals, closeLeftModals } = usePlayerUIActions();
    const isChatOpen = useGroupWatch((state) => state.isChatOpen);
    const { displayLeftControls, isLeftMenuOpen } = usePlayerUI((state) => ({
        displayLeftControls: state.displayLeftControls,
        isLeftMenuOpen: state.isLeftModalsOpen,
    }));

    const lockLeft: LockLeft = useCallback(({ isOpen, openModal, closeModal }) => {
        return {
            isOpen,
            openModal: () => {
                openLeftModals();
                openModal();
            },
            closeModal: () => {
                closeLeftModals();
                closeModal();
            },
        };
    }, [closeLeftModals, openLeftModals]);

    return (
        <HoverElement
            element={'div'}
            onHover={setHovered}
            className={
                tw('flex justify-start gap-x-4 items-center w-1/3 fullHD:w-1/5 h-full', {
                    'gap-x-3': isChatOpen,
                })
            }
        >
            {
                (displayLeftControls || hovered || isLeftMenuOpen) &&
                <>
                    <CastButton />
                    <ShareButton name={name} playbackId={playbackId} episodeName={episodeName} />
                    <AddToPlaylistButton name={name} mediaId={mediaId} videoId={videoId} lockLeft={lockLeft} />
                    <VolumeSlider />
                    <DownloadButton playbackId={playbackId} lockLeft={lockLeft} episodeName={episodeName} name={name} />
                </>
            }
        </HoverElement>
    );
}
