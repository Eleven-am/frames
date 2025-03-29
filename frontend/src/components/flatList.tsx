import { useEffect, ReactNode } from 'react';

import { useEventListener } from '@/hooks/useEventListener';
import { UseFlatListOptions, useFlatList } from '@/hooks/useFlatList';
import { tw } from '@/utils/style';


interface MediaListProps {
    options?: UseFlatListOptions;
    children: ReactNode;
    className?: string;
    noReset?: boolean;
    keyBoardNavigation?: boolean;
}

const className = 'absolute flex items-center justify-center p-3 mx-2 rounded-full shadow-xl backdrop-blur-lg transition-all duration-200 ease-in-out';

export function FlatList ({ children, options, className: ulClassName, keyBoardNavigation }: MediaListProps) {
    const { plugParent, plugUlList, LeftChevronButton, RightChevronButton, resetScroll, moveRight, moveLeft, resetVisibility } = useFlatList(
        {
            ...options,
        },
    );

    useEffect(() => resetScroll(), [children, resetScroll]);
    useEffect(() => resetVisibility(), [children, resetVisibility]);

    useEventListener('keydown', (event) => {
        if (keyBoardNavigation) {
            if (event.key === 'ArrowLeft') {
                moveLeft();
            } else if (event.key === 'ArrowRight') {
                moveRight();
            }
        }
    });

    return (
        <div
            className={'flex w-full relative items-center scrollbar-hide'}
        >
            <div className={'w-full overflow-x-scroll pl-4 py-0 ipadMini:pl-8 scrollbar-hide'} ref={plugParent}>
                <ul className={tw('flex flex-row items-start mt-4 ipadMini:mt-6 mb-8 scrollbar-hide', ulClassName)} ref={plugUlList}>
                    {children}
                </ul>
            </div>
            <LeftChevronButton
                className={
                    tw(
                        className,
                        'bg-dark-200/50 text-light-600 stroke-text-light-600',
                        'hover:bg-dark-400/70 hover:text-light-800 hover:stroke-text-light-800 hover:scale-110',
                    )
                }
                svgClassName={'stroke-2 w-6 h-6 ipadMini:w-10 ipadMini:h-10'}
            />
            <RightChevronButton
                className={
                    tw(
                        className,
                        'bg-dark-200/50 text-light-600 stroke-text-light-600',
                        'hover:bg-dark-400/70 hover:text-light-800 hover:stroke-text-light-800 hover:scale-110',
                    )
                }
                svgClassName={'stroke-2 w-6 h-6 ipadMini:w-10 ipadMini:h-10'}
            />
        </div>
    );
}

FlatList.Skeleton = ({ className, children }: { className?: string, children: ReactNode }) => (
    <ul className={tw('flex flex-row items-start mt-4 ipadMini:mt-6 pl-4 ipadMini:pl-8 pb-8 w-full overflow-x-hidden', className)}>
        {children}
    </ul>
);
