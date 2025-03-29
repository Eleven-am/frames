import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { DraggablePlaylistCards } from '@/components/playlist/draggablePlaylistCards';
import { PlaylistDesktopCard } from '@/components/playlist/playlistDesktopCard';
import { PlaylistProvider } from '@/contexts/playlist';
import { createPlaylistAndRedirect, playlistQueries } from '@/queries/playlist';

const routeApi = getRouteApi('/_protected/playlist/_playlist/create');

function CreatePlaylistPage () {
    const data = routeApi.useLoaderData();

    return (
        <PlaylistProvider
            count={data.count}
            action={createPlaylistAndRedirect}
        >
            <PlaylistDesktopCard>
                <DraggablePlaylistCards />
            </PlaylistDesktopCard>
        </PlaylistProvider>
    );
}


export const Route = createFileRoute('/_protected/playlist/_playlist/create')({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(playlistQueries.playlistCount),
    component: CreatePlaylistPage,
    notFoundComponent: () => <ErrorClient
        hideCarousel
        title={'Playlist not found'}
        message={'The playlist you are looking for does not exist.'}
    />,
});
