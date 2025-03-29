import { createFileRoute } from '@tanstack/react-router';

import { Privacy } from '@/components/settings/privacy';

export const Route = createFileRoute('/_protected/settings/_settings/privacy')({
    component: Privacy,
});
