import {MetaTags, useNavBar} from "../client/next/components/navbar/navigation";
import {SpringMedia} from "../server/classes/media";
import Info from "../client/next/components/info/info";
import {useFetcher} from "../client/utils/customHooks";
import {MediaType} from "@prisma/client";
import {useEffect} from "react";
import useCast from "../client/utils/castContext";
import {InfoContext, infoUserContext, resetInfo} from "../client/next/components/info/infoContext";
import {useSetRecoilState} from "recoil";
import {GetServerSidePropsContext} from "next";
import {useGroupWatch} from "../client/utils/groupWatch";
import {SpringMedUserSpecifics} from "../server/classes/user";
import GroupWatchHandler, {GroupWatchSlide} from "../client/next/components/lobby/groupWatchHandler";
import useNotifications from "../client/utils/notifications";
import {ManageMedia} from "../client/next/components/misc/editMedia";

export default function InfoPage({info, metaTags}: { info: SpringMedia, metaTags: MetaTags }) {
    const reset = resetInfo();
    const {sendMessage} = useCast();
    const setUserData = useSetRecoilState(infoUserContext);
    const setMediaData = useSetRecoilState(InfoContext);
    const {lobbyOpen} = useGroupWatch();
    const {modifyPresence} = useNotifications();
    useNavBar(info.type === MediaType.MOVIE ? "movies" : "tv shows", 1, metaTags);
    useFetcher('/api/media/specificUserData?mediaId=' + info.id, {
        onSuccess: (data: SpringMedUserSpecifics) => {
            setUserData(data);
        }
    });

    useEffect(() => {
        const {logo, name, overview, backdrop} = info;
        sendMessage({action: 'displayInfo', logo, name, overview, backdrop});
        modifyPresence('online', {logo, name, overview, backdrop});
        setMediaData(info);
        return () => reset();
    }, [info])

    return (
        <>
            {lobbyOpen ? <GroupWatchHandler/> : <Info/>}
            <ManageMedia/>
            <GroupWatchSlide/>
        </>
    );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    let mediaId: number;
    const AuthService = await import("../server/classes/auth").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const SpringBoard = await import("../server/classes/springboard").then(m => m.default);

    const authService = new AuthService();
    const middleware = new MiddleWare();
    const springboard = new SpringBoard();

    const data = await middleware.readCookie(ctx.req.cookies, 'frames-cookie');

    const presentUser = await authService.getUserFromSession(data.session);
    const userId = presentUser?.userId || 'unknown';
    const pathname = ctx.query;

    if (pathname.hasOwnProperty('mediaId'))
        mediaId = +(pathname.mediaId)!;

    else {
        const type = pathname.hasOwnProperty('movie') ? MediaType.MOVIE : MediaType.SHOW;
        const data = type === 'MOVIE' ? pathname.movie : pathname.show;
        let value = Array.isArray(data) ? data[0] : data;
        const result = middleware.convertUrl(value as string);
        mediaId = await springboard.findMedia(result, type);
    }

    const info = await springboard.getMedia(mediaId, userId);
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
