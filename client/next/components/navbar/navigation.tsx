import Head from "next/head";
import {atom, DefaultValue, selector, useRecoilValue, useSetRecoilState} from 'recoil';
import {ReactNode, useEffect} from "react";
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

export const MetaTagAtom = atom<MetaTags | null>({
    key: 'MetaTagAtom',
    default: null
})

export const hideAtom = atom({
    key: 'hideAtom',
    default: false
})

export function Header() {
    const meta = useRecoilValue(MetaTagAtom) || metaTags;

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
}

export default function HomeLayout({children}: { children: ReactNode }) {
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

export function useNavBar(section: navSection, opacity: number, meta?: MetaTags) {
    const setNavBar = useSetRecoilState(NavSectionAndOpacity);
    const setMetaTags = useSetRecoilState(MetaTagAtom);
    useEffect(() => {
        setNavBar({opacity, section});
        setMetaTags(meta || metaTags);
    }, [section, opacity]);
    return null;
}