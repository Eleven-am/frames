import { createFileRoute } from '@tanstack/react-router';

import { TrendingContainer } from '@/components/carousel';
import { Metadata } from '@/components/metadata';
import { Privacy } from '@/components/settings/privacy';

function PrivacyPage () {
    return (
        <TrendingContainer>
            <Metadata title={'Privacy Policy'} />
            <div className={'fixed w-full h-full top-0 left-0 p-6 bg-darkD/40 backdrop-blur-lg'}>
                <Privacy />
            </div>
        </TrendingContainer>
    );
}

export const Route = createFileRoute('/privacy')({
    component: PrivacyPage,
});
