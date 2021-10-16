import {GetServerSidePropsContext} from "next";
import HomeLayout, {addressAtom, MetaTags} from "../../next/states/navigation";
import Frames, {Listeners} from "../../next/components/frames/frames";
import {SpringPlay} from "../../server/classes/springboard";
import {useEffect, useState} from "react";
import {useNavBar} from "../../next/utils/customHooks";
import NProgress from "nprogress";
import {useRouter} from "next/router";
import {Loading} from "../../next/components/misc/Loader";
import {useSetRecoilState} from "recoil";
import useCast from "../../next/utils/castContext";
import useGroupWatch from "../../next/utils/groupWatch";

export default function FramesPlayer({meta, response, room}: { room?: string, response: SpringPlay, meta: MetaTags }) {
    const [loading, setLoading] = useState(false);
    const setAddress = useSetRecoilState(addressAtom);
    const {sendMessage} = useCast();
    const {updateRoom, setRoom, connect} = useGroupWatch(true);
    useNavBar('watch', 1);
    const router = useRouter();

    const handleRouteChange = async (url: string, {shallow}: { shallow: boolean }) => {
        if (!shallow)
            setLoading(true);
    }

    useEffect(() => {
        router.events.on('routeChangeStart', handleRouteChange)

        return () => {
            router.events.off('routeChangeStart', handleRouteChange)
        }
    }, [router])

    async function doStuff() {
        setLoading(false);
        !response.frame && room === undefined && await router.replace('/watch=' + response.location, undefined, {shallow: true});
        await updateRoom(response.location);
        if (room) {
            connect();
            setRoom(room);
        }
    }

    useEffect(() => {
        doStuff();
    }, [response])

    useEffect(() => {
        if (room)
            setAddress('/room=' + room);

        else if (response.playlistId)
            setAddress('/watch?next=x' + response.playlistId);

        else
            setAddress('/watch?id=' + response.mediaId);

        NProgress.done();
        return () => sendMessage({action: 'destroy'});
    }, [])

    if (loading)
        return <Loading/>;

    return (
        <div id={'frames-container'}>
            <HomeLayout meta={meta} frame={response.frame}>
                <Frames response={response}/>
                <Listeners response={response}/>
            </HomeLayout>
        </div>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const req = context.req;
    const link = req.headers.host + '/watch=';

    let {userId} = await import('./api/auth').then(mod => mod.confirmContext(req.cookies));
    const check = await import('../../next/SSR').then(mod => mod.confirmUser(userId));
    userId = !check ? await import('../../next/SSR').then(mod => mod.getGuest()) : userId;

    let holder = pathname.roomKey ? pathname.roomKey : pathname.frame ? pathname.frame : pathname.shuffle ? pathname.shuffle : pathname.next ? pathname.next : pathname.id ? pathname.id : pathname.episode ? pathname.episode : pathname.media;
    if (holder && pathname.roomKey) {
        const response = await import('../../next/SSR').then(mod => mod.findRoom(holder as string, userId));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response, room: holder as string}};

    } else if (holder && pathname.frame) {
        const response = await import('../../next/SSR').then(mod => mod.findFrame(holder as string, userId));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('frame', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};

    } else if (holder && pathname.id) {
        const response = await import('../../next/SSR').then(mod => mod.playMedia(+(holder)!, userId));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};

    } else if (holder && pathname.episode) {
        const response = await import('../../next/SSR').then(mod => mod.playMedia(+(holder)!, userId, true));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};

    } else if (holder && pathname.shuffle) {
        const response = await import('../../next/SSR').then(mod => mod.shuffleMedia(+(holder)!, userId));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};

    } else if (holder && pathname.next) {
        holder = Array.isArray(holder) ? holder[0] : holder;
        const type = holder.charAt(0) === 'e';
        const playlist = holder.charAt(0) === 'x';
        holder = holder.replace(/[ex]/, '');
        const response = await import('../../next/SSR').then(mod => playlist ? mod.playFromPlaylist(+(holder)!, userId) : mod.playMedia(+(holder)!, userId, type));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};

    } else if (pathname.media) {
        const auth = Array.isArray(holder) ? holder[0] : holder;
        const response = await import('../../next/SSR').then(mod => mod.findAuth(auth!, userId));
        const meta = response ? await import('../../next/SSR').then(mod => mod.metaTags('watch', response.location!)) : null;
        if (meta && response)
            return {props: {meta: {...meta, link: link + response.location}, response}};
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}