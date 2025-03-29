import { createFileRoute } from '@tanstack/react-router';

import { Access } from '@/components/settings/access';

export const Route = createFileRoute('/_protected/settings/_settings/_admin/access')({
    component: Access,
});
