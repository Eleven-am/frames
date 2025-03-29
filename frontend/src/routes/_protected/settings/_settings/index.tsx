import { SettingsSidebar } from '@/components/settings/settingsSidebar';
import { createFileRoute } from '@tanstack/react-router';

function SettingsPage () {
    return (
        <>
            <div
                className={'w-full h-full gap-x-4 hidden ipadMini:flex items-center justify-center text-lightest/50'}
            />
            <SettingsSidebar className={'ipadMini:hidden h-full w-full'} />
        </>
    );
}

export const Route = createFileRoute('/_protected/settings/_settings/')({
    component: SettingsPage,
});
