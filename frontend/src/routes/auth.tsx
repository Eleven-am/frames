import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { authItems } from '@/components/auth/forms';
import { AccountIcon, StateManager } from '@/components/auth/stateManager';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { Metadata } from '@/components/metadata';
import { ProcessForm } from '@/components/processForm';
import { RedirectTo } from '@/components/redirectTo';
import { authStore } from '@/providers/authStore';
import { useUser } from '@/providers/userProvider';


const authSearchSchema = z.object({
    redirect: z.string().catch('/'),
    reset: z.string().optional(),
    verify: z.string().optional(),
    authKey: z.string().optional(),
});

const routeApi = getRouteApi('/auth');

function AuthComponent () {
    const { redirect } = routeApi.useSearch();
    const session = useUser((state) => state.session);
    const { token, process, authKey } = routeApi.useLoaderData();

    return (
        <RedirectTo shouldRedirect={Boolean(session)} redirectPath={redirect}>
            <Metadata title={'Authenticate to continue'} />
            <ProcessForm items={authItems} process={process} provider={authStore}>
                <StateManager authKey={authKey} token={token}>
                    <ProcessForm.Form>
                        <AccountIcon />
                        <ProcessForm.FlashMessage />
                        <ProcessForm.Items />
                    </ProcessForm.Form>
                </StateManager>
            </ProcessForm>
        </RedirectTo>
    );
}

export const Route = createFileRoute('/auth')({
    component: AuthComponent,
    pendingComponent: Loading,
    validateSearch: authSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: ({ deps }) => authStore.initProcess(deps),
    beforeLoad: ({ context, search }) => {
        if (context.session) {
            throw redirect({
                to: search.redirect,
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
