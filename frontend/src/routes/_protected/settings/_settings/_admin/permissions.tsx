import { createFileRoute } from '@tanstack/react-router';

import { Permissions } from '@/components/settings/permissions';

export const Route = createFileRoute('/_protected/settings/_settings/_admin/permissions')({
    component: Permissions,
});
