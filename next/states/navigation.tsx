import Head from "next/head";
import {atom, DefaultValue, selector, useRecoilState, useRecoilValue} from 'recoil';
import {ReactNode, useEffect} from "react";
import useUser from "../utils/userTools";
import {useRouter} from "next/router";
import SearchLayout from "../components/search/search";
import Navbar from "../components/navbar/navbar";
import AccountInfo from "../components/navbar/infoHolder/AccountInfo";
import {Loading} from "../components/misc/Loader";
import {ManageMedia} from "../components/misc/editMedia";
import ManagePick from "../components/misc/editPicks";

interface NavSectionAndOpacity {
    opacity?: number;
    section?: string;
}

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

export const NavConTextAtom = atom({
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

const searchActive = selector({
    key: 'searchActiveNav',
    get: ({get}) => {
        return get(SearchContextAtom) !== '';
    }
});

export const addressAtom = atom<string | null>({
    key: 'addressAtom',
    default: null
})

export function Header({meta}: { meta: MetaTags }) {
    return (
        <Head>
            <link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png"/>
            <link rel="manifest" href="favicons/site.webmanifest"/>
            <link rel="shortcut icon" href="/favicon.ico"/>
            <meta name="msapplication-TileColor" content="#da532c"/>
            <meta name="msapplication-config" content="/favicons/browserconfig.xml"/>
            <meta name="theme-color" content="#ffffff"/>

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

export default function HomeLayout({children, meta, frame}: { children: ReactNode, meta?: MetaTags, frame?: boolean }) {
    const {user, loading} = useUser(frame, true);
    const searchContext = useRecoilValue(searchActive);
    const [address, setAddress] = useRecoilState(addressAtom);
    const router = useRouter();
    const asPath = router.asPath;

    useEffect(() => {
        if (loading && address === null)
            setAddress(asPath);
    }, [loading])

    if (loading)
        return (
            <>
                <Header meta={meta || metaTags}/>
                <Loading/>
            </>
        );

    if (!user && !loading) {
        router.push('/auth');
        return <Header meta={meta || metaTags}/>;
    }

    return (
        <>
            <Header meta={meta || metaTags}/>
            <Navbar/>
            <AccountInfo/>
            <ManageMedia/>
            <ManagePick/>
            <div
                style={!searchContext ? {visibility: "visible"} : {visibility: "hidden", opacity: 0}}>
                {children}
            </div>
            <div style={searchContext ? {visibility: "visible"} : {visibility: "hidden"}}>
                <SearchLayout/>
            </div>
        </>
    )
}