import { createFileRoute } from '@tanstack/react-router';

import { Download } from '@/components/settings/download';

export const Route = createFileRoute(
    '/_protected/settings/_settings/downloads',
)({
    component: Download,
});
