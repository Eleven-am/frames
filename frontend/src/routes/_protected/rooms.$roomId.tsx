import { useEffect } from 'react';

import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { GroupWatchAction } from '@/components/groupWatchAction';
import { Loading } from '@/components/loading-set/Loading';
import { WatchPageComponent } from '@/components/watch/watchPageComponent';
import { useGroupWatchActions } from '@/providers/groupWatch';
import { watchQueries } from '@/queries/watch';


const routeApi = getRouteApi('/_protected/rooms/$roomId');

function RoomComponent () {
    const { roomId } = routeApi.useParams();
    const { joinRoom } = useGroupWatchActions();
    const session = routeApi.useLoaderData();

    useEffect(() => joinRoom(roomId, session || null), [roomId, joinRoom, session]);

    return (
        <GroupWatchAction>
            <WatchPageComponent isGroupWatch session={session} />
        </GroupWatchAction>
    );
}

export const Route = createFileRoute('/_protected/rooms/$roomId')({
    component: RoomComponent,
    pendingComponent: Loading,
    loader: ({ params, context: { queryClient } }) => queryClient.ensureQueryData(watchQueries.roomData(params.roomId)),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error Playing Media'}
        message={(error as Error).message}
    />,
    notFoundComponent: () => <ErrorClient
        title={'Video not found'}
        message={'The video you are looking for does not exist'}
    />,
});
