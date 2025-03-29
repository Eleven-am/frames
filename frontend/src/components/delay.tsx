import { ReactNode, useState, useEffect, useCallback } from 'react';

import { Loading } from '@/components/loading-set/Loading';
import { useTimer } from '@/hooks/useIntervals';

interface DelayProps {
    showLoader?: boolean;
    delay: number;
    children: ReactNode;
}

export function Delay ({ showLoader = false, delay, children }: DelayProps) {
    const { start, stop } = useTimer();
    const [display, setDisplay] = useState(false);

    const manageDisplay = useCallback(() => {
        stop();
        start(() => setDisplay(true), delay);
    }, [delay, start, stop]);

    useEffect(() => manageDisplay(), [manageDisplay]);

    if (showLoader && !display) {
        return (
            <Loading />
        );
    }

    if (!display) {
        return null;
    }

    return (
        <>
            {children}
        </>
    );
}
