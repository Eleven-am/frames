import { PlaylistItemSchema } from '@/api/data-contracts';
import { PlaylistItem } from '@/components/listItem';
import { useInfiniteScroll } from '@eleven-am/xquery';
import { UseInfiniteScrollOptions } from '@eleven-am/xquery/types';

interface PlaylistListProps {
    isPublic?: boolean;
    options: UseInfiniteScrollOptions<PlaylistItemSchema>;
}

export function PlaylistList ({ options, isPublic = false }: PlaylistListProps) {
    const [playlists, ref] = useInfiniteScroll(options);

    if (!playlists.length) {
        return (
            <div
                key={isPublic ? 'public' : 'private'}
                className="flex flex-col items-center pt-4 max-ipadMini:w-full max-ipadMini:mb-20 max-ipadMini:pb-20 gap-4 overflow-y-scroll scrollbar-hide"
            >
                <span>
                    No playlists found
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-4 max-ipadMini:w-full max-ipadMini:mb-20 max-ipadMini:pb-20 gap-4 overflow-y-scroll scrollbar-hide" key={isPublic ? 'public' : 'private'}>
            {
                playlists.map((playlist) => (
                    <PlaylistItem
                        id={playlist.id}
                        key={playlist.id}
                        name={playlist.name}
                        hidePublic={isPublic}
                        backdrop={playlist.backdrop}
                        overview={playlist.overview}
                        videoCount={playlist.videoCount}
                        isPublic={playlist.isPublic}
                    />
                ))
            }
            <div ref={ref} className="w-full h-2" />
        </div>
    );
}
