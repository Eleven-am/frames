import { createFileRoute } from '@tanstack/react-router';

import { Faq } from '@/components/settings/faq';

export const Route = createFileRoute('/_protected/settings/_settings/faq')({
    component: Faq,
});
