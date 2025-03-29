import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { DraggablePlaylistCards } from '@/components/playlist/draggablePlaylistCards';
import { PlaylistDesktopCard } from '@/components/playlist/playlistDesktopCard';
import { PlaylistProvider } from '@/contexts/playlist';
import { playlistQueries, updatePlaylist } from '@/queries/playlist';

const routeApi = getRouteApi('/_protected/playlist/_playlist/$playlistId');

function SinglePlaylistPage () {
    const data = routeApi.useLoaderData();

    return (
        <PlaylistProvider
            initialData={data}
            action={updatePlaylist}
        >
            <PlaylistDesktopCard>
                <DraggablePlaylistCards />
            </PlaylistDesktopCard>
        </PlaylistProvider>
    );
}

export const Route = createFileRoute('/_protected/playlist/_playlist/$playlistId')({
    loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(playlistQueries.getPlaylist(params.playlistId)),
    component: SinglePlaylistPage,
    notFoundComponent: () => <ErrorClient
        hideCarousel
        title={'Playlist not found'}
        message={'The playlist you are looking for does not exist.'}
    />,
});
