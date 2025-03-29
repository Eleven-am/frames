import { ReactNode } from 'react';

import backgroundImage from '@/assets/background.jpg';
import { LazyImage } from '@/components/lazyImage';
import { useBlurState } from '@/providers/blurProvider';
import { createStyles } from '@/utils/colour';

export function SecondBackground ({ children }: { children: ReactNode }) {
    const blur = useBlurState((state) => state.blur);

    return (
        <div style={createStyles(blur)}>
            <div className={'fixed top-0 left-0 w-screen h-svh bg-darkD'}>
                <LazyImage
                    alt={''}
                    loading={'eager'}
                    src={backgroundImage}
                    className={'opacity-10 dark:opacity-5 object-cover w-full h-full'}
                />
            </div>
            {children}
        </div>
    );
}
