import { PlaylistVideoResponseSchema } from '@/api/data-contracts';
import { DragNDropProvider } from '@/components/DragNDrop';
import { PlaylistVideoCard } from '@/components/playlist/playlistVideoCard';
import { usePlaylistContext } from '@/contexts/playlist';

export function DraggablePlaylistCards () {
    const { playlist, reorderVideos } = usePlaylistContext();

    return (
        <DragNDropProvider<PlaylistVideoResponseSchema>
            onDrop={reorderVideos}
            elements={playlist.videos}
            className={'w-full h-full overflow-y-scroll scrollbar-hide flex flex-col ipadMini:py-9 max-ipadMini:px-2 max-ipadMini:pb-44'}
            Component={PlaylistVideoCard}
        />
    );
}
