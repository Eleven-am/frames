import { createFileRoute } from '@tanstack/react-router';

import { SettingsPage } from '@/components/settings/settingsPage';

export const Route = createFileRoute('/_protected/settings/_settings')({
    component: SettingsPage,
});
