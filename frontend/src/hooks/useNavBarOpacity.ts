import { useEffect } from 'react';

import { MotionValue } from 'framer-motion';

import { useNavbarActions } from '@/providers/navbarProvider';


export function useNavBarOpacity (value: MotionValue<number>) {
    const { setOpacity } = useNavbarActions();

    useEffect(() => {
        const unsubscribe = value.on('change', (latest) => {
            setOpacity(latest);
        });

        return () => {
            unsubscribe();
            setOpacity(0);
        };
    }, [setOpacity, value]);
}
