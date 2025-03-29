import { Link } from '@tanstack/react-router';
import { useCallback } from 'react';

export function Copyright () {
    const openInNewTab = useCallback((url: string) => () => {
        const newWindow = window.open(url, '_blank');
        if (newWindow) newWindow.focus();
    }, []);

    return (
        <div className={'absolute bottom-[4dvh] w-full text-center text-lightest text-sm ipadMini:text-lg flex flex-col items-center justify-center'}>
            <span className={'font-bold'}>
                Copyright © 2020 - {new Date().getFullYear()} by {' '}
                <button
                    onClick={openInNewTab('https://github.com/Eleven-am')}
                    className={'cursor-pointer hover:text-lightL'}
                    title={'View Eleven AM on GitHub'}
                >
                    Roy Ossai.
                </button>
            </span>
            <span className={'text-sm'}>
                All rights reserved.
            </span>
            <span className={'text-sm'}>
                <Link to={'/privacy'} className={'cursor-pointer hover:text-lightL'}>Privacy Policy</Link> | <Link to={'/terms'} className={'cursor-pointer hover:text-lightL'}>Terms of Use</Link>
            </span>
        </div>
    );
}
