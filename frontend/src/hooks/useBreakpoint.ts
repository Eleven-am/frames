import { useCallback, useState, useEffect } from 'react';

type ScreenSizes = {
    iphoneSE: string;
    iphone8: string;
    iphonePlus: string;
    iphone14: string;
    ipadMini: string;
    ipadPro: string;
    macbook: string;
    imac: string;
    imacPro: string;
    fullHD: string;
    imacProMax: string;
}

const screens: ScreenSizes = {
    iphoneSE: '320px',
    iphone8: '375px',
    iphonePlus: '414px',
    iphone14: '480px',
    ipadMini: '1024px',
    ipadPro: '1112px',
    macbook: '1366px',
    imac: '1440px',
    imacPro: '1680px',
    fullHD: '1920px',
    imacProMax: '2048px',
};

export function useMediaQuery (query: string) {
    const [matches, setMatches] = useState(false);
    const handleChanges = useCallback((e: MediaQueryListEvent) => setMatches(e.matches), []);

    useEffect(() => {
        const media = window.matchMedia(query);

        setMatches(media.matches);
        media.addEventListener('change', handleChanges);

        return () => media.removeEventListener('change', handleChanges);
    }, [handleChanges, query]);

    return matches;
}

export function useMinBreakpoint (breakpoint: keyof ScreenSizes) {
    return useMediaQuery(`(min-width: ${screens[breakpoint]})`);
}

export function useMaxBreakpoint (breakpoint: keyof ScreenSizes) {
    return useMediaQuery(`(max-width: ${screens[breakpoint]})`);
}
