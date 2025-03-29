import { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import ss from './Loading.module.css';

interface DisplayLoaderProps {
    loading: boolean;
    noItems?: boolean;
    children: ReactNode;
}

export function Loading () {
    return (
        <div className={`${ss.bb1} min-h-screen`}>
            <div className={ss.bb2}>
                <div className={ss.circle} />
                <div className={ss.circle} />
            </div>
        </div>
    );
}

export function DisplayLoader ({ loading, noItems = false, children }: DisplayLoaderProps) {
    if (loading) {
        return (
            <div className={'w-full h-full flex justify-center items-center'}>
                <div className={'loader text-lightest'} />
            </div>
        );
    }

    if (noItems) {
        return (
            <div
                className={'flex border-2 border-lightest/10 rounded-md justify-center items-center mb-4 h-full w-full text-lightest/60'}
            >
                No items found
            </div>
        );
    }

    return (
        <>
            {children}
        </>
    );
}
