import { createFileRoute } from '@tanstack/react-router';

import { Terms } from '@/components/settings/terms';

export const Route = createFileRoute('/_protected/settings/_settings/terms')({
    component: Terms,
});
