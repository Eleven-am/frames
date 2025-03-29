import { useEffect } from 'react';

import { createFileRoute, Navigate, Outlet, redirect, useRouter } from '@tanstack/react-router';


import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { Metadata } from '@/components/metadata';
import { SearchLayout } from '@/components/searchLayout';
import { useUser } from '@/providers/userProvider';
import { useVideoManagerActions } from '@/providers/watched/videoManager';


function ProtectedComponent () {
    const router = useRouter();
    const { session, loading } = useUser();
    const { cleanUp } = useVideoManagerActions();

    useEffect(() => {
        if (!loading && !session) {
            cleanUp();
        }
    }, [cleanUp, loading, session]);

    if (loading) {
        return (
            <Loading />
        );
    }

    if (!session) {
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

    return (
        <>
            <Metadata />
            <SearchLayout>
                <Outlet />
            </SearchLayout>
        </>
    );
}

export const Route = createFileRoute('/_protected')({
    pendingComponent: Loading,
    component: ProtectedComponent,
    beforeLoad: ({ context, location }) => {
        if (!context.session && !context.sessionLoading) {
            throw redirect({
                to: '/auth',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    errorComponent: ({ error }) => (
        <ErrorClient
            title={'Something went wrong'}
            message={(error as Error).message}
        />
    ),
});
