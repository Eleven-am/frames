import { FC, memo } from 'react';

import { useMaxBreakpoint } from '@/hooks/useBreakpoint';


type ResponsiveProps<T> = {
    Mobile: FC<{ data: T }>;
    Desktop: FC<{ data: T }>;
}

export function responsive<T> ({ Mobile, Desktop }: ResponsiveProps<T>) {
    return memo(({ data }: { data: T }) => {
        const isMobile = useMaxBreakpoint('iphonePlus');

        return (
            <>
                {
                    isMobile
                        ? (
                            <Mobile data={data} />
                        )
                        : (
                            <Desktop data={data} />
                        )
                }
            </>
        );
    });
}
