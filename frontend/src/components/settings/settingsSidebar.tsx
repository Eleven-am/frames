import { Role } from '@/api/data-contracts';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { useUser } from '@/providers/userProvider';
import { tw } from '@/utils/style';

import { useRouter, useMatches } from '@tanstack/react-router';
import { useMemo, useCallback } from 'react';


type Route = '/settings' | '/settings/profile' | '/settings/activity' |
    '/settings/notifications' | '/settings/access' | '/settings/libraries' |
    '/settings/picks' | '/settings/permissions' | '/settings/frames' |
    '/settings/faq' | '/settings/privacy' | '/settings/terms' |
    '/settings/downloads';

const routes = [
    '/_protected/settings/_settings/profile',
    '/_protected/settings/_settings/activity',
    '/_protected/settings/_settings/notifications',
    '/_protected/settings/_settings/_admin/access',
    '/_protected/settings/_settings/_admin/_libraries/libraries',
    '/_protected/settings/_settings/_admin/picks',
    '/_protected/settings/_settings/_admin/permissions',
    '/_protected/settings/_settings/_admin/frames',
    '/_protected/settings/_settings/faq',
    '/_protected/settings/_settings/privacy',
    '/_protected/settings/_settings/terms',
    '/_protected/settings/_settings/downloads',
    '/_protected/settings/_settings/_admin/_libraries/unscanned'
] as const;

interface SettingsSidebarProps {
    className?: string;
}

export function SettingsSidebar ({ className }: SettingsSidebarProps) {
    const router = useRouter();
    const matches = useMatches();
    const user = useUser((state) => state.session);
    const activeSegment = useMemo(() => matches.map((match) => match.routeId), [matches]);

    const navigate = useCallback((route: Route) => router.navigate({
        to: route,
    }), [router]);

    const activeIndex = useMemo(() => routes.findIndex((route) => activeSegment.includes(route)), [activeSegment]);

    return (
        <div className={tw('flex flex-col gap-y-8 h-full', className)}>
            <BaseSection
                label={'Settings'}
                className={'shadow-black/50 shadow-sm'}
                settings={
                    [
                        {
                            label: 'Profile',
                            className: activeIndex === 0 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/profile'),
                        },
                        {
                            label: 'Activity',
                            className: activeIndex === 1 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/activity'),
                        },
                        {
                            label: 'Notifications',
                            className: activeIndex === 2 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/notifications'),
                        },
                        {
                            label: 'Downloads',
                            className: activeIndex === 11 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/downloads'),
                        },
                    ]
                }
            />
            {
                user?.role === Role.ADMIN && (
                    <BaseSection
                        className={'shadow-black/50 shadow-sm'}
                        settings={
                            [
                                {
                                    label: 'Users access & authentication',
                                    className: activeIndex === 3 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                                    onClick: () => navigate('/settings/access'),
                                },
                                {
                                    label: 'Manage libraries',
                                    className: activeIndex === 4 || activeIndex === 12 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                                    onClick: () => navigate('/settings/libraries'),
                                },
                                {
                                    label: 'Manage editorial picks',
                                    className: activeIndex === 5 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                                    onClick: () => navigate('/settings/picks'),
                                },
                                {
                                    label: 'Groups & permissions',
                                    className: activeIndex === 6 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                                    onClick: () => navigate('/settings/permissions'),
                                },
                                {
                                    label: 'Frames settings',
                                    className: activeIndex === 7 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                                    onClick: () => navigate('/settings/frames'),
                                },
                            ]
                        }
                    />
                )
            }
            <BaseSection
                className={'shadow-black/50 shadow-sm'}
                description={`Copyright © 2020 - ${new Date().getFullYear()} by Roy Ossai. All rights reserved`}
                settings={
                    [
                        {
                            label: 'Frequently Asked Questions',
                            className: activeIndex === 8 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/faq'),
                        },
                        {
                            label: 'Privacy Policy',
                            className: activeIndex === 9 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/privacy'),
                        },
                        {
                            label: 'Terms of Service',
                            className: activeIndex === 10 ? 'bg-lightL/50 text-white cursor-pointer' : 'cursor-pointer',
                            onClick: () => navigate('/settings/terms'),
                        },
                    ]
                }
            />
        </div>
    );
}
