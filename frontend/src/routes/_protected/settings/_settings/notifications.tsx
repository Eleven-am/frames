import { createFileRoute } from '@tanstack/react-router';

import { Notifications } from '@/components/settings/notifications';

export const Route = createFileRoute('/_protected/settings/_settings/notifications')({
    component: Notifications,
});
