import { userStore } from '@/providers/userProvider';
import { getSnapshot } from '@eleven-am/notifier';
import { QueryClient } from '@tanstack/react-query';
import { NavigateFn } from '@tanstack/router-core';

export interface IRouterContext {
    queryClient: QueryClient;
    session: string | null;
    sessionLoading: boolean;
}

export const queryClient = new QueryClient();

export function getClient (): IRouterContext {
    const { token, loading } = getSnapshot(userStore);

    return {
        session: token,
        sessionLoading: loading,
        queryClient,
    };
}

export const navigate: NavigateFn = async (opts) => window.tsRouter.navigate(opts);
