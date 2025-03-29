import { createFileRoute } from '@tanstack/react-router';

import { TrendingContainer } from '@/components/carousel';
import { Metadata } from '@/components/metadata';
import { Terms } from '@/components/settings/terms';

function TermsPage () {
    return (
        <TrendingContainer>
            <Metadata title={'Terms of Service'} />
            <div className={'fixed w-full h-full top-0 left-0 p-6 bg-darkD/40 backdrop-blur-lg'}>
                <Terms />
            </div>
        </TrendingContainer>
    );
}
export const Route = createFileRoute('/terms')({
    component: TermsPage,
});
