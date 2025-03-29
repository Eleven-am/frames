import { ReactNode, useEffect, useMemo } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { IoArrowBack } from 'react-icons/io5';

import { PlaylistVideoResponseSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { PlayButton } from '@/components/framesButtons';
import { LazyImage } from '@/components/lazyImage';
import { PlaylistAddModal } from '@/components/playlist/playlistAddModal';
import { PlaylistButtons, PlaylistShuffleButton } from '@/components/playlist/playlistButtons';
import { PlaylistName, PlaylistOverview } from '@/components/playlist/playlistInputs';
import { usePlaylistContext } from '@/contexts/playlist';
import { useBlurActions } from '@/providers/blurProvider';
import { generateCompleteStyles } from '@/utils/colour';

interface PlaylistDesktopCardProps {
    children: ReactNode;
}

export function PlaylistDesktopCard ({ children }: PlaylistDesktopCardProps) {
    const { setBlur } = useBlurActions();
    const { playlist } = usePlaylistContext();
    const { styles, firstVideo } = useMemo(() => {
        const firstVideo = playlist.videos[0] as PlaylistVideoResponseSchema;

        if (firstVideo) {
            return {
                styles: generateCompleteStyles(firstVideo.backdropBlur, firstVideo.backdropBlur, null),
                firstVideo,
            };
        }

        return {
            styles: undefined,
            firstVideo: undefined,
        };
    }, [playlist.videos]);

    useEffect(() => setBlur(firstVideo?.backdropBlur), [firstVideo, setBlur]);

    return (
        <>
            <div
                style={styles}
                className={'ipadMini:flex bg-gradient-to-t from-dark-500/70 to-light-500/70 w-full text-light-700 h-full gap-x-2 fullHD:gap-x-4 py-5 ipadMini:rounded-xl ipadMini:shadow-black ipadMini:shadow-lg backdrop-blur-xl backdrop-filter'}
            >
                <BaseButton
                    to={'/playlist'}
                    title={'Back to playlists'}
                    className={'absolute top-0 w-8 h-8 rounded-full m-4 flex items-center justify-center cursor-pointer border-2 border-dark-200 text-dark-200 transition-all duration-200 ease-in-out hover:border-light-700 hover:text-light-700'}
                >
                    <IoArrowBack strokeWidth={4} className={'w-5 h-5'} />
                </BaseButton>
                <div
                    className={'max-iphonePlus:mt-10 w-full ipadMini:w-1/2 fullHD:w-1/3 flex flex-col gap-y-4 p-4 border-r-2 border-lightest/5'}
                >
                    <LazyImage
                        className={'w-full h-auto mt-6 rounded-xl shadow-black shadow-md'}
                        src={firstVideo?.backdrop ?? ''}
                        alt={playlist.name}
                        loading={'eager'}
                    />
                    <PlaylistName />
                    <div className={'flex items-center justify-between'}>
                        <span
                            className={'text-sm text-shadow-sm font-bold text-light-900'}
                        >
                            {playlist.author}
                        </span>
                        <span className={'text-sm text-shadow-sm font-medium'}>
                            {
                                formatDistanceToNow(new Date(playlist.updatedAt), {
                                    addSuffix: true,
                                })
                            }
                        </span>
                    </div>
                    <PlaylistOverview />
                    <div className={'flex items-center justify-center gap-x-4'}>
                        <PlayButton
                            playlistId={playlist.id}
                            display={'playlist'}
                            name={playlist.name}
                        />
                        <PlaylistShuffleButton />
                    </div>
                    <PlaylistButtons />
                </div>
                {children}
            </div>
            <PlaylistAddModal />
        </>
    );
}
