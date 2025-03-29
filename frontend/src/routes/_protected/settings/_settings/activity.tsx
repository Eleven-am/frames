import { createFileRoute } from '@tanstack/react-router';

import { Activity } from '@/components/settings/activity';

export const Route = createFileRoute('/_protected/settings/_settings/activity')({
    component: Activity,
});
