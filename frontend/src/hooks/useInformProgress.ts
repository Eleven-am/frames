import { useState, useCallback, useEffect } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { Role } from '@/api/data-contracts';
import { useUserActions, useUser } from '@/providers/userProvider';
import { useProgressAndVolume } from '@/providers/watched/playerPageStates';
import { usePlayerSessionState } from '@/providers/watched/playerSession';
import { watchMutations } from '@/queries/watch';


export function useInformProgress (playbackId: string) {
    const { logout } = useUserActions();
    const router = useRouter();
    const [lastTime, setLastTime] = useState(0);
    const { mutate } = useMutation(watchMutations.saveProgress(playbackId));
    const isGuest = useUser((state) => state.session?.role === Role.GUEST);

    const { isFrame, canInform } = usePlayerSessionState((state) => ({
        isFrame: state.isFrame,
        canInform: state.inform,
    }));

    const { shouldInform, shouldLogOut, currentTime, percentage } = useProgressAndVolume((state) => ({
        shouldInform: (state.percentage > 0) && ((state.currentTime < lastTime) || ((state.currentTime - lastTime) >= 30)) && canInform,
        shouldLogOut: !isFrame && isGuest && state.currentTime >= 300,
        currentTime: state.currentTime,
        percentage: state.percentage,
    }));

    const handleInform = useCallback(() => {
        if (shouldInform && currentTime) {
            setLastTime(currentTime);
            mutate(percentage);
        }
    }, [currentTime, mutate, percentage, shouldInform]);

    const handleLogout = useCallback(() => {
        if (shouldLogOut) {
            void logout();
            void router.navigate({
                to: '/auth',
                search: {
                    redirect: '/',
                },
            });
        }
    }, [shouldLogOut, logout, router]);

    useEffect(() => handleInform(), [handleInform]);
    useEffect(() => handleLogout(), [handleLogout]);
}
