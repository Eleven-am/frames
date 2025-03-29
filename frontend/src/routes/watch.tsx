import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { WatchPageComponent } from '@/components/watch/watchPageComponent';
import { useInitialiseClientState } from '@/hooks/useInitialiseClientState';
import { usePlayerSessionActions } from '@/providers/watched/playerSession';
import { WatchSearch, watchSearchSchema, watchQueries } from '@/queries/watch';
import { createFileRoute, redirect, getRouteApi } from '@tanstack/react-router';


function beforeWatchLoad (href: string, search: WatchSearch, token: string | null) {
    if (!token && !search.frame) {
        throw redirect({
            to: '/auth',
            search: {
                redirect: href,
            },
        });
    }
}

const routeApi = getRouteApi('/watch');

function WatchComponent () {
    const search = routeApi.useSearch();
    const { setState } = usePlayerSessionActions();
    const session = routeApi.useLoaderData();

    useInitialiseClientState(setState, session);

    return (
        <WatchPageComponent session={session} isFrame={Boolean(search.frame)} />
    );
}

export const Route = createFileRoute('/watch')({
    pendingComponent: Loading,
    component: WatchComponent,
    validateSearch: watchSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: ({ deps, context: { queryClient } }) => queryClient.ensureQueryData(watchQueries.getSession(deps)),
    beforeLoad: ({ context, search, location }) => beforeWatchLoad(location.href, search, context.session),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error Playing Media'}
        message={(error as Error).message}
    />,
    notFoundComponent: () => <ErrorClient
        title={'Video not found'}
        message={'The video you are looking for does not exist'}
    />,
});
