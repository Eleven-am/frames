import { Role } from '@/api/data-contracts';
import { SecondBackground } from '@/components/background';
import { getClient } from '@/hooks/useClientAction';
import { useWindowListener } from '@/hooks/useEventListener';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavbarActions } from '@/providers/navbarProvider';
import { useNotificationActions } from '@/providers/notificationChannel';
import { useFramesSocketActions } from '@/providers/realtimeNotifier';
import { useUser, useUserActions } from '@/providers/userProvider';
import { chromecastManager } from '@/providers/watched/castManager';
import { getRouter } from '@/router';

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import NProgress from 'nprogress';
import { ReactNode, useEffect } from 'react';

import './nprogress.css';

NProgress.configure({
    trickleSpeed: 1200,
    showSpinner: false,
    easing: 'ease-in-out',
    speed: 500,
});

const router = getRouter();
const context = getClient();

function NProgressComponent ({ children }: { children: ReactNode }) {
    const { subscribeToNotifications } = useNotificationActions();
    const { setSearch } = useNavbarActions();

    useSubscription(() => router.subscribe('onBeforeLoad', ({ pathChanged }) => pathChanged && NProgress.start()));
    useSubscription(() => router.subscribe('onResolved', () => setSearch('')));
    useSubscription(() => router.subscribe('onLoad', () => NProgress.done()));
    useSubscription(() => subscribeToNotifications());

    return (
        <>
            {children}
        </>
    );
}

export function App () {
    const { logout } = useUserActions();
    const { session, token, loading } = useUser();
    const { connect, disconnect } = useFramesSocketActions();

    useWindowListener('beforeunload', () => {
        disconnect();
        chromecastManager.disconnect();
        session?.role === Role.GUEST && logout();
    })

    useEffect(() => {
        if (session && token) {
           return connect('/api/realtime');
        }
    }, [connect, session, token]);

    return (
        <QueryClientProvider client={context.queryClient}>
            <NProgressComponent>
                <SecondBackground>
                    <RouterProvider
                        router={router}
                        context={
                            {
                                ...context,
                                session: token,
                                sessionLoading: loading,
                            }
                        }
                    />
                </SecondBackground>
            </NProgressComponent>
        </QueryClientProvider>
    );
}
