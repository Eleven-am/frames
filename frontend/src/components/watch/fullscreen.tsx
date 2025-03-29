import { CSSProperties, ReactNode } from 'react';

import { usePlayerUIActions } from '@/providers/watched/playerUI';

interface TrackedElementProps {
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
}

export function FullScreenTrackedComponent ({ style, className, children }: TrackedElementProps) {
    const { setFullScreenElement } = usePlayerUIActions();

    return (
        <div
            style={style}
            className={className}
            ref={setFullScreenElement}
        >
            {children}
        </div>
    );
}
