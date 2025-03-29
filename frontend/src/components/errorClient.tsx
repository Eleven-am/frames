import { useEffect } from 'react';

import { FiAlertTriangle } from 'react-icons/fi';

import { TrendingCarousel } from '@/components/carousel';
import { useNavbarActions } from '@/providers/navbarProvider';


interface ErrorClientProps {
    title: string;
    message: string;
    recover?: () => void;
    hideCarousel?: boolean;
}

export function ErrorClient ({
    title,
    message,
    recover,
    hideCarousel = false,
}: ErrorClientProps) {
    const { setForceNav } = useNavbarActions();

    useEffect(() => {
        setForceNav(true);

        return () => setForceNav(false);
    }, [setForceNav]);

    return (
        <>
            {!hideCarousel && <TrendingCarousel />}
            <div
                onClick={recover}
                className={'w-full h-screen relative flex flex-col items-center justify-center text-white text-center'}
            >
                <div
                    className={'flex max-ipadMini:flex-col justify-center items-center text-darkM text-shadow-md dark:text-lightL border-lightest border rounded-md gap-x-4 px-12 py-8 backdrop-blur-lg'}
                >
                    <FiAlertTriangle className={'w-20 h-20'} />
                    <div className={'flex flex-col items-center justify-center'}>
                        <span className={'text-xl ipadMini:text-2xl font-bold text-center'}>
                            {title}
                        </span>
                        <span className={'text-sm ipadMini:text-md font-bold text-center'}>
                            {message}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
