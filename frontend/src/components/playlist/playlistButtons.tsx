import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { FiLock, FiUnlock } from 'react-icons/fi';
import { GoShare } from 'react-icons/go';
import { HiOutlineTrash } from 'react-icons/hi2';
import { IoAddOutline } from 'react-icons/io5';
import { TbArrowsShuffle } from 'react-icons/tb';

import { RoundedButton, PrimaryButton } from '@/components/button';
import { usePlaylistContext } from '@/contexts/playlist';
import { useDialogActions } from '@/providers/dialogStore';
import { playlistMutations } from '@/queries/playlist';

export function PlaylistButtons () {
    const { navigate } = useRouter();
    const { createDialog } = useDialogActions();
    const { mutate } = useMutation(playlistMutations.deletePlaylist);
    const { playlist, canModify, canDelete, toggleModal, togglePublic } = usePlaylistContext();

    const deleteAction = useCallback(() => {
        createDialog({
            title: `Delete ${playlist.name}`,
            content: `Are you sure you want to delete ${playlist.name}? This action cannot be undone.`,
            acceptAction: {
                label: 'Cancel',
                light: true,
            },
            declineAction: {
                label: 'Delete',
                isDestructive: true,
                onClick: () => mutate(playlist.id, {
                    onSuccess: () => navigate({
                        to: '/playlist',
                    }),
                }),
            },
        });
    }, [createDialog, mutate, navigate, playlist.id, playlist.name]);

    if (!canModify) {
        return null;
    }

    return (
        <div className={'flex items-center justify-center gap-x-3'}>
            <RoundedButton title={'Edit playlist'} onClick={toggleModal}>
                <IoAddOutline className={'w-6 h-6'} />
            </RoundedButton>
            <RoundedButton title={'Share playlist'}>
                <GoShare className={'w-6 h-6'} />
            </RoundedButton>
            <RoundedButton
                title={`Make playlist ${playlist.isPublic ? 'private' : 'public'}`}
                onClick={togglePublic}
            >
                {playlist.isPublic ? <FiLock className={'w-6 h-6'} /> : <FiUnlock className={'w-6 h-6'} />}
            </RoundedButton>
            {
                canDelete && (
                    <RoundedButton
                        title={'Delete playlist'}
                        onClick={deleteAction}
                    >
                        <HiOutlineTrash className={'w-6 h-6'} />
                    </RoundedButton>
                )
            }
        </div>
    );
}

export function PlaylistShuffleButton () {
    const { playlist } = usePlaylistContext();

    return (
        <PrimaryButton
            label={'shuffle'}
            title={'Shuffle playlist'}
            to={'/watch'}
            search={
                {
                    playlistId: playlist.id,
                    shuffle: true,
                }
            }
        >
            <TbArrowsShuffle className={'w-6 h-6'} />
        </PrimaryButton>
    );
}
