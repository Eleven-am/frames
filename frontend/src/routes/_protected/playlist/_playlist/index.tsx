import { createFileRoute } from '@tanstack/react-router';
import { FiAlertTriangle } from 'react-icons/fi';

import { ErrorClient } from '@/components/errorClient';
import { AllPlaylists } from '@/components/playlist/allPlaylists';

function PlaylistComponent () {
    return (
        <>
            <div
                className={'w-full h-full gap-x-4 hidden ipadMini:flex items-center justify-center text-lightest/50 border-l-2 border-lightest/10'}
            >
                <FiAlertTriangle className={'w-20 h-20'} />
                <span className={'text-2xl font-medium'}>No playlist selected</span>
            </div>
            <AllPlaylists className={'ipadMini:hidden pt-14'} />
        </>
    );
}

export const Route = createFileRoute('/_protected/playlist/_playlist/')({
    component: PlaylistComponent,
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching playlist data'}
        message={(error as Error).message}
    />,
});
