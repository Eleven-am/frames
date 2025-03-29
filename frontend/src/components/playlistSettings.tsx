import { Modal } from '@/components/modal';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { playlistActions } from '@/queries/playlist';
import { tw } from '@/utils/style';
import { useAction } from '@eleven-am/xquery';
import { useCallback, CSSProperties } from 'react';

import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md';


export interface PlaylistModalProps {
    open: boolean;
    name: string;
    mediaId: string;
    onClose: () => void;
    videoId?: string;
    className?: string;
    style?: CSSProperties;
}

export function PlaylistSettings ({ name, mediaId, videoId, open, className, onClose, style }: PlaylistModalProps) {
    const { data: playlists, mutate } = useAction(playlistActions.addPlaylist(mediaId, videoId || null));

    const handlePlaylistClick = useCallback((playlistId: string, mediaInPlaylist: boolean) => () => {
        mutate({
            playlistId,
            name: null,
            action: mediaInPlaylist ? 'Remove' : 'Add',
        });
    }, [mutate]);

    const createNewPlaylist = useCallback((name: string) => {
        mutate({
            name,
            playlistId: '',
            action: 'Create',
        });
    }, [mutate]);

    return (
        <Modal
            open={open}
            style={style}
            onClose={onClose}
            className={tw('flex flex-col items-center justify-start overflow-hidden gap-y-6 py-4 w-11/12 ipadMini:w-1/3 h-2/3 px-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg', className)}
        >
            <BaseSection
                label={'Add to Playlist'}
                description={'Sometimes it may indicate that the media is already in the playlist. This is because at least a single episode of the media is in the playlist. To make sure all episodes are in the playlist, remove the media from the playlist and add it again, or create a new playlist.'}
                addItem={
                    {
                        label: 'Create New Playlist',
                        startValue: `${name} Playlist`,
                        onCreate: createNewPlaylist,
                    }
                }
                settings={
                    playlists
                        .map(({ playlistId, playlistName, mediaInPlaylist }) => ({
                            label: playlistName,
                            onClick: handlePlaylistClick(playlistId, mediaInPlaylist),
                            rightElement: mediaInPlaylist ?
                                <MdRadioButtonChecked className={'text-lightest fill-lightest w-6 h-6 cursor-pointer'} /> :
                                <MdRadioButtonUnchecked className={'text-lightest fill-lightest w-6 h-6 cursor-pointer'} />,
                        }))
                }
            />
        </Modal>
    );
}
