import { useState, useMemo } from 'react';

import { isMobileDevice } from '@/utils/style';

export function useHoverButton () {
    const [hover, setHover] = useState(false);
    const isMobile = useMemo(() => isMobileDevice(), []);
    const isHovered = useMemo(() => {
        if (isMobile) {
            return false;
        }

        return hover;
    }, [hover, isMobile]);

    return [isHovered, setHover] as const;
}
