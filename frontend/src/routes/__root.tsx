import { DialogProvider } from '@/components/dialog';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { Navbar } from '@/components/navbar';
import { NotificationManager } from '@/components/notificationManager';
import { IRouterContext } from '@/hooks/useClientAction';
import { useUser } from '@/providers/userProvider';
import { miscQueries } from '@/queries/misc';
import { useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Navigate, Outlet, useRouter } from '@tanstack/react-router';


function RootErrorComponent ({ error, reset }: { error: Error, reset: () => void }) {
    // useEffect(() => () => reset(), [reset]);

    return (
        <>
            <ErrorClient
                title={'Something went wrong'}
                message={error.message}
            />
            <Navbar />
        </>
    );
}

function RootComponent () {
    return (
        <>
            <NotificationManager>
                <DialogProvider>
                    <Outlet />
                </DialogProvider>
            </NotificationManager>
            <Navbar />
        </>
    );
}

function NotFoundComponent () {
    const router = useRouter();
    const session = useUser((state) => state.session);
    const { isLoading, data } = useQuery(miscQueries.beforeLoad(router.latestLocation.href));

    if (!session && !router.latestLocation.href.startsWith('/f=')) {
        return (
            <Navigate
                to={'/auth'}
                search={
                    {
                        redirect: router.latestLocation.href,
                    }
                }
            />
        );
    }

    if (isLoading) {
        return (
            <Loading />
        );
    }

    if (data) {
        return (
            <Navigate
                search={'search' in data ? data.search : undefined}
                params={'params' in data ? data.params : undefined}
                mask={data.mask}
                to={data.to}
            />
        );
    }

    return (
        <>
            <ErrorClient
                title={'Page not found'}
                message={'The page you are looking for does not exist'}
            />
            <Navbar />
        </>
    );
}

export const Route = createRootRouteWithContext<IRouterContext>()({
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: RootErrorComponent,
});
