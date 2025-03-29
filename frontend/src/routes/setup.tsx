import { createFileRoute } from '@tanstack/react-router';

import { Copyright } from '@/components/copyright';
import { ErrorClient } from '@/components/errorClient';
import { Metadata } from '@/components/metadata';
import { ProcessForm } from '@/components/processForm';
import { RedirectTo } from '@/components/redirectTo';
import { setupItems, AccountIcon } from '@/components/setup/forms';
import { SetupCarousel } from '@/components/setup/misc';
import { StorageConfigModal } from '@/components/setup/storageConfigModal';
import { setupProvider } from '@/providers/setupProvider';
import { useUser } from '@/providers/userProvider';

function SetupComponent () {
    const session = useUser((state) => state.session);

    return (
        <RedirectTo shouldRedirect={Boolean(session)} redirectPath={'/'}>
            <Metadata title={'Setup your account'} />
            <ProcessForm items={setupItems} provider={setupProvider}>
                <SetupCarousel />
                <ProcessForm.Form>
                    <AccountIcon />
                    <ProcessForm.Items />
                </ProcessForm.Form>
                <Copyright />
                <StorageConfigModal />
            </ProcessForm>
        </RedirectTo>
    );
}

export const Route = createFileRoute('/setup')({
    component: SetupComponent,
    loader: () => setupProvider.getConfiguration(),
    errorComponent: ({ error }) => (
        <ErrorClient
            title={'Something went wrong'}
            message={(error as Error).message}
        />
    ),
});
