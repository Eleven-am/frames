import Head from "next/head";
import {atom, DefaultValue, selector} from 'recoil';
import {ReactNode} from "react";
import {useRouter} from "next/router";
import Navbar from "./navbar";
import useUser from "../../../utils/userTools";
import {Loading} from "../misc/Loader";
import SearchLayout from "../search/search";
import {useSearch} from "../../../utils/customHooks";

interface NavSectionAndOpacity {
    opacity?: number;
    section?: navSection;
}

export type navSection =
    "home"
    | "movies"
    | "tv shows"
    | "playlists"
    | "collections"
    | "watch"
    | "auth"
    | "others"
    | "groupWatch";

export interface MetaTags {
    name: string;
    overview: string;
    poster: string;
    link: string;
}

const metaTags = {
    overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
    name: 'Frames - Watch FREE TV Shows and Movies Online',
    link: 'frames.io',
    poster: '/meta.png'
}

export const SideMenu = atom({
    key: 'sideMenuNav',
    default: 0
})

export const NavConTextAtom = atom<navSection>({
    key: 'navConTextAtom',
    default: 'watch'
})

export const SearchContextAtom = atom({
    key: 'searchContextAtom',
    default: ''
})

export const NavOpacityAtom = atom({
    key: 'NavOpacityAtom',
    default: 1
})

export const NavSectionAndOpacity = selector<NavSectionAndOpacity>({
    key: 'NavSectionAndOpacity',
    get: ({get}) => {
        let opacity = get(NavOpacityAtom);
        const section = get(NavConTextAtom);
        opacity = opacity === 0 ? opacity : 1 - opacity > 1 ? 1 : 1 - opacity;
        return {opacity, section}
    },
    set: ({get, set}, newValue) => {
        if (!(newValue instanceof DefaultValue)) {
            newValue.section && set(NavConTextAtom, newValue.section);
            newValue.opacity && set(NavOpacityAtom, newValue.opacity);
            return;
        }
    }
});

export const addressAtom = atom<string | null>({
    key: 'addressAtom',
    default: null
})

export function Header({meta}: { meta: MetaTags }) {
    return (
        <Head>
            <title>{meta.name}</title>
            <meta key="name" name="title" content={meta.name}/>
            <meta key="description" name="description" content={meta.overview}/>

            <meta key="ogType" property="og:type" content="website"/>
            <meta key="ogLink" property="og:url" content={meta.link}/>
            <meta key="ogName" property="og:title" content={meta.name}/>
            <meta key="ogDescription" property="og:description" content={meta.overview}/>
            <meta key="ogImage" property="og:image" content={meta.poster}/>

            <meta key="twitterType" property="twitter:card" content="summary_large_image"/>
            <meta key="twitterLink" property="twitter:url" content={meta.link}/>
            <meta key="twitterName" property="twitter:title" content={meta.name}/>
            <meta key="twitterDescription" property="twitter:description" content={meta.overview}/>
            <meta key="twitterImage" property="twitter:image" content={meta.poster}/>
        </Head>
    )
}

export default function HomeLayout({children, meta}: { children: ReactNode, meta?: MetaTags }) {
    const {user, loading} = useUser();
    const {active} = useSearch();
    const router = useRouter();
    const asPath = router.asPath;

    if (loading)
        return (
            <>
                <Header meta={meta || metaTags}/>
                <Loading/>
            </>
        );

    if (!user && !loading && asPath !== '/auth') {
        router.push('/auth');
        return <Header meta={meta || metaTags}/>;
    }

    return (
        <>
            <Header meta={meta || metaTags}/>
            <Navbar/>
            {active ? <SearchLayout/> : <>{children}</>}
        </>
    )
}