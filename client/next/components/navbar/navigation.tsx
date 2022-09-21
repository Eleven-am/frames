import Head from "next/head";
import {atom, DefaultValue, selector, useRecoilValue, useSetRecoilState} from 'recoil';
import {memo, ReactNode, useCallback, useEffect} from "react";
import {useRouter} from "next/router";
import Navbar, {useSearch} from "./navbar";
import {Image, Loading} from "../misc/Loader";
import useUser from "../../../utils/user";
import SearchLayout from "../search/search";
import useCast from "../../../utils/castContext";
import {useWindowListener} from "../../../utils/customHooks";
import {Role} from "@prisma/client";
import Script from "next/script";
import ss from "../misc/Loading.module.css";
import background from "../../assets/background.jpg";

interface NavSectionAndOpacity {
    opacity?: number;
    section?: navSection;
    metaTags?: MetaTags;
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

export const SearchContextAtom = atom({
    key: 'searchContextAtom',
    default: ''
})

const NavConTextAtom = atom<navSection>({
    key: 'navConTextAtom',
    default: 'watch'
})

export const NavOpacityAtom = atom({
    key: 'NavOpacityAtom',
    default: 1
})

const MetaTagAtom = atom<MetaTags>({
    key: 'MetaTagAtom',
    default: metaTags
})

const PreviousNavStateAtom = atom<{section: navSection, opacity: number, meta?: MetaTags}>({
    key: 'previousNavStateAtom',
    default: {
        section: 'watch',
        opacity: 1,
        meta: metaTags
    }
});

export const NavSectionAndOpacity = selector<NavSectionAndOpacity>({
    key: 'NavSectionAndOpacity',
    get: ({get}) => {
        let opacity = get(NavOpacityAtom);
        const section = get(NavConTextAtom);
        const metaTags = get(MetaTagAtom);
        opacity = opacity === 0 ? opacity : 1 - opacity > 1 ? 1 : 1 - opacity;
        return {opacity, section, metaTags}
    },
    set: ({get, set}, newValue) => {
        if (!(newValue instanceof DefaultValue)) {
            const opacity = get(NavOpacityAtom);
            const section = get(NavConTextAtom);
            const metaTags = get(MetaTagAtom);
            const previousNavState = {section, opacity, meta: metaTags};

            set(PreviousNavStateAtom, previousNavState);
            newValue.section && set(NavConTextAtom, newValue.section);
            newValue.opacity && set(NavOpacityAtom, newValue.opacity);
            newValue.metaTags && set(MetaTagAtom, newValue.metaTags);
            return;
        }
    }
});

export const addressAtom = atom<string | null>({
    key: 'addressAtom',
    default: null
})

export const hideAtom = atom({
    key: 'hideAtom',
    default: false
})

const Header = memo(() => {
    const meta = useRecoilValue(MetaTagAtom);

    return (
        <>
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

            <Script src="https://www.youtube.com/iframe_api"/>
            <div id={ss.bck}>
                <Image src={background} className={ss.bckImg} loading={"eager"}/>
            </div>
        </>
    )
})

function HomeLayout({children}: { children: ReactNode }) {
    const {user, loading, signOut} = useUser();
    const {active} = useSearch();
    const router = useRouter();
    const asPath = router.asPath;
    const hide = useRecoilValue(hideAtom);
    const {disconnect} = useCast();

    useWindowListener('beforeunload', async () => {
        disconnect();
        user?.role === Role.GUEST && await signOut();
    })

    useWindowListener('dragstart', (ev) => {
        ev.preventDefault();
        return false;
    })

    if (!user && !loading && !/^\/(auth|frame)/.test(asPath)) {
        router.push('/auth');
        return (
            <>
                <Header/>
                <Navbar signOut={signOut} user={user}/>
                <Loading/>
            </>
        );
    }

    return (
        <>
            <Header/>
            <Navbar signOut={signOut} user={user}/>
            {loading || hide ? <Loading/> : active ? <SearchLayout/> : <>{children}</>}
        </>
    )
}

export default memo(HomeLayout);

export function useNavBar(section?: navSection, opacity?: number, metaTag?: MetaTags) {
    const prevState = useRecoilValue(PreviousNavStateAtom);
    const setNavBar = useSetRecoilState(NavSectionAndOpacity);

    const goBack = useCallback(() => {
        const {section, opacity, meta} = prevState;
        setNavBar({opacity, section, metaTags: meta});
    }, [prevState, setNavBar])

    const manualSet = useCallback((section1: navSection, opacity1: number, meta1?: MetaTags) => {
        setNavBar({opacity: opacity1, section: section1, metaTags: meta1});
    }, [setNavBar])

    useEffect(() => {
        if (section && opacity)
            manualSet(section, opacity, metaTag || metaTags);
    }, []);

    return {goBack, manualSet}
}
