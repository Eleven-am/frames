import { ReactNode, useEffect } from 'react';

import { GuestButton } from '@/components/auth/buttons';
import { AvatarIcon } from '@/components/avatar';
import { TrendingCarousel } from '@/components/carousel';
import { Copyright } from '@/components/copyright';
import { Metadata } from '@/components/metadata';
import { useInitialiseClientState } from '@/hooks/useInitialiseClientState';
import { authStore, useAuthStoreActions, useAuthStore, AuthProcess } from '@/providers/authStore';
import { tw } from '@/utils/style';

export interface StateManagerProps {
    children: ReactNode;
    authKey: string | null;
    token: string | null;
}

export function StateManager ({ children, authKey, token }: StateManagerProps) {
    const { setServerSetAuthKey, setToken } = useAuthStoreActions();

    useInitialiseClientState(setServerSetAuthKey, authKey);
    useInitialiseClientState(setToken, token);
    useEffect(() => () => authStore.reset(), []);

    return (
        <div className={'relative min-h-svh'}>
            <TrendingCarousel />
            <Metadata />
            {children}
            <Copyright />
            <GuestButton />
        </div>
    );
}

export function AccountIcon () {
    const process = useAuthStore((state) => state.process);

    return (
        <div className={'flex flex-col items-center justify-center'}>
            <div
                className={
                    tw('absolute w-20 h-20 border-2 border-lightest rounded-full p-2 fullHD:scale-125 transition-all duration-500 ease-in-out', {
                        '-top-8': process !== AuthProcess.Success,
                        'top-32': process === AuthProcess.Success,
                    })
                }
            >
                <AvatarIcon
                    circleClassName={'fill-darkD'}
                    circleOpacity={0.2}
                    sessionClassName={'fill-lightest'}
                />
            </div>
        </div>
    );
}
