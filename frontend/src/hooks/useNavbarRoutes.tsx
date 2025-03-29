import { useMemo, ReactNode } from 'react';

import { useMatches } from '@tanstack/react-router';
import { FiFilm } from 'react-icons/fi';
import { MdChecklistRtl } from 'react-icons/md';
import { PiQueue, PiTelevision } from 'react-icons/pi';
import { RiHome2Line } from 'react-icons/ri';


interface Route {
    name: string;
    path: string;
    segments: string[];
    Icon: ReactNode;
    routeId?: string[];
}

function generateRoutes (): Route[] {
    return [
        {
            name: 'home',
            path: '/',
            segments: ['/_protected/'],
            Icon: <RiHome2Line />,
        },
        {
            name: 'movies',
            path: '/movies',
            segments: ['/_protected/movies', '/_protected/movie/$mediaId'],
            Icon: <FiFilm />,
        },
        {
            name: 'tv shows',
            path: '/shows',
            segments: ['/_protected/shows', '/_protected/show/$mediaId'],
            Icon: <PiTelevision />,
        },
        {
            name: 'your list',
            path: '/list',
            segments: ['/_protected/list'],
            Icon: <MdChecklistRtl />,
        },
        {
            name: 'playlists',
            path: '/playlist',
            segments: ['/_protected/playlist'],
            Icon: <PiQueue />,
        },
    ];
}

export function useNavbarRoutes () {
    const matches = useMatches();
    const activeSegment = useMemo(() => matches.map((match) => match.routeId), [matches]);

    const routes = useMemo(generateRoutes, []);

    const activeRoute = useMemo(() => {
        if (activeSegment.length === 0) {
            return 0;
        }

        return routes
            .findIndex((route) => activeSegment
                .some((segment) => route
                    .segments.includes(segment)));
    }, [activeSegment, routes]);

    const isAuthRoute = useMemo(() => activeSegment.includes('/auth'), [activeSegment]);
    const isSetupRoute = useMemo(() => activeSegment.includes('/setup'), [activeSegment]);
    const isPlayerRoute = useMemo(() => activeSegment.includes('/watch'), [activeSegment]);
    const isRoomRoute = useMemo(() => activeSegment.includes('/_protected/rooms/$roomId'), [activeSegment]);
    const isPrivacyOrTerms = useMemo(() => activeSegment.includes('/privacy') || activeSegment.includes('/terms'), [activeSegment]);

    return {
        routes,
        activeRoute,
        isPlayerRoute: isPlayerRoute || isRoomRoute,
        isAuthRoute: isAuthRoute || isSetupRoute || isPrivacyOrTerms,
    };
}

