import HomeLayout, {MetaTags} from "../client/next/components/navbar/navigation";
import {SpringMedia, SpringMedUserSpecifics} from "../server/classes/media";
import Info from "../client/next/components/info/info";
import {useDetectPageChange, useFetcher, useNavBar} from "../client/utils/customHooks";
import {MediaType, Role} from "@prisma/client";
import {Loading} from "../client/next/components/misc/Loader";
import {useEffect} from "react";
import useCast from "../client/utils/castContext";
import {infoUserContext, resetInfo} from "../client/next/components/info/infoContext";
import {useSetRecoilState} from "recoil";
import {GetServerSidePropsContext} from "next";
import {useGroupWatch} from "../client/utils/groupWatch";
import GroupWatchHandler from "../client/next/components/misc/groupWatchHandler";
import {ManageHolders} from "../client/next/components/misc/editMedia";
import {CookiePayload} from "../server/classes/middleware";

export default function InfoPage({info, metaTags}: { info: SpringMedia, metaTags: MetaTags }) {
    const reset = resetInfo();
    const {sendMessage} = useCast();
    const {loading, url} = useDetectPageChange(true);
    const setUserData = useSetRecoilState(infoUserContext);
    const {lobbyOpen} = useGroupWatch();
    useNavBar(info.type === MediaType.MOVIE ? "movies" : "tv shows", 1);
    useFetcher('/api/media/specificUserData?mediaId=' + info.id, {
        onSuccess: (data: SpringMedUserSpecifics) => {
            setUserData(data);
        },
        onError: (error: any) => {
            console.log(error);
        }
    });

    useEffect(() => {
        const {logo, name, overview, backdrop} = info;
        sendMessage({action: 'displayInfo', logo, name, overview, backdrop});
        return () => reset();
    }, [info])

    if (loading && /\/(movie|show)=/.test(url))
        return <Loading/>;

    return (
        <HomeLayout meta={metaTags}>
            <ManageHolders/>
            {lobbyOpen ? <GroupWatchHandler/> : <Info response={info}/>}
        </HomeLayout>
    );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    let mediaId: number;
    const User = await import("../server/classes/auth").then(m => m.default);
    const Media = await import("../server/classes/media").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const user = new User();
    const media = new Media();
    const middleware = new MiddleWare();

    const data = await middleware.confirmContent<CookiePayload>(ctx.req.cookies, 'frames-cookie') || {
        email: 'unknown',
        context: Role.GUEST,
        session: 'unknown',
        validUntil: 0,
    };

    const presentUser = await user.getUserFromSession(data.session);
    const userId = presentUser?.userId || 'unknown';
    const pathname = ctx.query;

    if (pathname.hasOwnProperty('mediaId'))
        mediaId = +(pathname.mediaId)!;

    else {
        const type = pathname.hasOwnProperty('movie') ? MediaType.MOVIE : MediaType.SHOW;
        const data = type === 'MOVIE' ? pathname.movie : pathname.show;
        let value = Array.isArray(data) ? data[0] : data;
        const result = middleware.convertUrl(value as string);
        mediaId = await media.findMedia(result, type);
    }

    const info = await media.getMedia(mediaId, userId);
    if (info) {
        const metaTags: MetaTags = {
            link: '/' + (info.type === MediaType.MOVIE ? 'movie' : 'show') + '=' + info.name.replace(/\s/g, '+').replace(/\//, '!!'),
            poster: info.poster,
            overview: info.overview,
            name: info.name
        }

        return {props: {info, metaTags}};
    }

    return {
        notFound: true
    }
}
