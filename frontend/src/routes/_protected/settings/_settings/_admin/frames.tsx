import { createFileRoute } from '@tanstack/react-router';

import { Frames } from '@/components/settings/frames';

export const Route = createFileRoute('/_protected/settings/_settings/_admin/frames')({
    component: Frames,
});
