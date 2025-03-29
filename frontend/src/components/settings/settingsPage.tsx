import { TrendingContainer } from '@/components/carousel';
import { SettingsSidebar } from '@/components/settings/settingsSidebar';
import { Outlet } from '@tanstack/react-router';


export function SettingsPage () {
    return (
        <TrendingContainer>
            <div className={'relative w-full h-[100vh] hidden ipadMini:flex'}>
                <SettingsSidebar className={'w-1/4 pt-12 bg-black/40 backdrop-blur-2xl'} />
                <div className={'w-3/4 h-full pt-12 flex items-start justify-center bg-black/30 backdrop-blur-lg'}>
                    <Outlet />
                </div>
            </div>
            <div className={'relative pt-14 ipadMini:hidden w-full h-[100vh] overflow-y-scroll scrollbar-hide bg-black/40 backdrop-blur-2xl'}>
                <Outlet />
            </div>
        </TrendingContainer>
    );
}
