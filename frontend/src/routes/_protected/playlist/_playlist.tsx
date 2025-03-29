import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { AllPlaylists } from '@/components/playlist/allPlaylists';
import { playlistQueries } from '@/queries/playlist';

function PlaylistComponent () {
    return (
        <>
            <div className={'hidden ipadMini:flex items-center justify-center absolute top-0 left-0 w-full h-svh'}>
                <div className={'flex items-center gap-x-4 pt-14 pb-4 mx-4 w-full h-full'}>
                    <AllPlaylists className={'w-1/3 imac:w-1/4'} />
                    <div className={'w-2/3 h-full py-4 imac:w-3/4'}>
                        <Outlet />
                    </div>
                </div>
            </div>
            <div className={'ipadMini:hidden w-full h-full overflow-y-hidden scrollbar-hide'}>
                <Outlet />
            </div>
        </>
    );
}

async function getPlaylistData (queryClient: QueryClient) {
    await queryClient.ensureQueryData(playlistQueries.getPlaylists);
    await queryClient.ensureQueryData(playlistQueries.getPublicPlaylists);
}

export const Route = createFileRoute('/_protected/playlist/_playlist')({
    loader: ({ context: { queryClient } }) => getPlaylistData(queryClient),
    component: PlaylistComponent,
    errorComponent: ({ error }) => <ErrorClient
        title={'A playlist error occurred'}
        message={error.message}
    />,
});
