import {MediaType} from '@prisma/client'
import {GetServerSidePropsContext} from "next";
import HomeLayout, {MetaTags} from "../../next/states/navigation";
import {useIsMounted, useNavBar} from "../../next/utils/customHooks";
import Info from "../../next/components/info/info";
import {useEffect, useState} from "react";
import {Router} from 'next/router';
import NProgress from "nprogress";
import {Loading} from "../../next/components/misc/Loader";
import {SpringMediaInfo} from "../../server/classes/springboard";
import {resetInfo} from "../../next/states/infoContext";
import useCast from "../../next/utils/castContext";

export default function InfoPage({meta, response}: { meta: MetaTags, response: SpringMediaInfo }) {
    const [loading, setLoading] = useState(false);
    const isMounted = useIsMounted();
    const {sendMessage} = useCast();
    useNavBar(response.type === MediaType.SHOW ? 'tv shows' : 'movies', 1);
    const reset = resetInfo();

    useEffect(() => {
        setLoading(false);
        NProgress.done();
        const {logo, name, overview, backdrop} = response;
        sendMessage({action: 'displayInfo', logo, name, overview, backdrop})
        return () => reset();
    }, [response])

    useEffect(() => {
        Router.events.on('routeChangeStart', url => {
            if (isMounted() && /\/(movie|show)=/.test(url))
                setLoading(true);
        })

        return () => {
            Router.events.off('routeChangeStart', url => {
                if (isMounted() && /\/(movie|show)=/.test(url))
                    setLoading(true);
            })
        }
    }, [])

    if (loading)
        return <Loading/>;

    return (
        <HomeLayout meta={meta}>
            <Info response={response}/>
        </HomeLayout>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const req = context.req;
    let mediaId: number;

    let {userId} = await import('./api/auth').then(mod => mod.confirmContext(req.cookies));
    if (pathname.hasOwnProperty('id'))
        mediaId = +(pathname.id)!;

    else {
        const type = pathname.hasOwnProperty('movie') ? MediaType.MOVIE : MediaType.SHOW;
        const data = type === 'MOVIE' ? pathname.movie : pathname.show;
        let value = Array.isArray(data) ? data[0] : data;
        value = await import('../../next/SSR').then(mod => mod.convertUrl(value || ''))
        mediaId = await import('../../next/SSR').then(mod => mod.findMedia(value || '', type));
    }

    const check = await import('../../next/SSR').then(mod => mod.confirmUser(userId));
    userId = !check ? await import('../../next/SSR').then(mod => mod.getGuest()) : userId;

    const response = await import('../../next/SSR').then(mod => mod.getInfo(userId, mediaId));
    if (response) {
        const host = req.headers.host;
        let url = 'http' + (host?.includes('localhost') ? '' : 's') + '://' + host;
        url = url + '/' + response.type + '=' + response.name.replace(/\s/, '+');

        const meta: MetaTags = {
            name: response.name,
            poster: response.poster,
            overview: response.overview,
            link: url
        }

        return {props: {meta, response}};
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}