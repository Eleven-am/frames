import { createFileRoute } from '@tanstack/react-router';

import { Profile } from '@/components/settings/profile';

export const Route = createFileRoute('/_protected/settings/_settings/profile')({
    component: Profile,
});
