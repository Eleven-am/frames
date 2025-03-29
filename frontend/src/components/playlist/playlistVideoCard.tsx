import { PlaylistVideoResponseSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { DragNDropElementProps } from '@/components/DragNDrop';
import { LazyImage } from '@/components/lazyImage';
import { usePlaylistContext } from '@/contexts/playlist';
import { tw } from '@/utils/style';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { useCallback } from 'react';
import { FiMenu } from 'react-icons/fi';
import { HiOutlineTrash } from 'react-icons/hi2';
import { IoPlay } from 'react-icons/io5';


type PlaylistVideoCardProps = DragNDropElementProps<PlaylistVideoResponseSchema>;

export function PlaylistVideoCard ({ item, listeners, style, setNodeRef, attributes }: PlaylistVideoCardProps) {
    const { playlist, canDelete, canModify, removeVideo } = usePlaylistContext();
    const performDelete = useCallback(() => {
        removeVideo(item.id);
    }, [item.id, removeVideo]);

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={'group text-light-600 hover:text-light-900 flex items-center w-full justify-center rounded-sm cursor-default gap-x-3'}
        >
            {
                canModify && (
                    <FiMenu {...listeners} className={'w-6 h-6 cursor-grab'} />
                )
            }
            <div className={'w-40 h-full flex items-center justify-between'}>
                <div className={'relative py-1 flex justify-center items-center'}>
                    <Link
                        to={'/watch'}
                        search={
                            {
                                playlistVideoId: item.id,
                            }
                        }
                    >
                        <LazyImage
                            className={'aspect-video rounded-sm shadow-black shadow-sm group-hover:shadow-black group-hover:shadow-md group-hover:border group-hover:border-lightest/50 transition-all duration-300'}
                            src={item.backdrop}
                            alt={item.name}
                            loading={'eager'}
                        />
                        <IoPlay className={'absolute w-8 h-8 bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 text-lightest/50 opacity-0 group-hover:opacity-100 transition-all duration-300'} />
                    </Link>
                </div>
            </div>
            <div
                className={
                    tw('grow h-full flex items-center', {
                        'mr-4': !canDelete,
                    })
                }
            >
                <div className={'flex flex-col flex-grow items-start justify-center h-full'}>
                    <span className={'text-lg font-bold line-clamp-2'}>
                        {item.name}
                    </span>
                    <div className={'flex h-1/2 w-full items-center justify-between'}>
                        <span className={'text-sm font-medium whitespace-nowrap w-1/2'}>
                            {playlist.author}
                        </span>
                        <span className={'text-sm font-medium text-right whitespace-nowrap w-1/2'}>
                            {
                                formatDistanceToNow(new Date(item.updatedAt), {
                                    addSuffix: true,
                                })
                            }
                        </span>
                    </div>
                </div>
                {
                    canDelete && (
                        <BaseButton
                            title={'Delete video'}
                            onClick={performDelete}
                            className={'max-ipadMini:flex-grow cursor-pointer flex relative justify-end items-center h-full'}
                        >
                            <HiOutlineTrash className={'w-6 h-6 ipadMini:mx-8 transition-all duration-300'} />
                        </BaseButton>
                    )
                }
            </div>
        </li>
    );
}
