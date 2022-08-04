import {GetServerSidePropsContext} from "next";
import {Role} from "@prisma/client";
import Background from "../client/next/components/misc/back";
import {useNavBar} from "../client/next/components/navbar/navigation";
import ss from "../client/next/components/settings/ACCOUNT.module.css";
import sss from "../client/next/components/playlists/Playlist.module.css";
import {useState} from "react";
import {SpringMedia} from "../server/classes/media";
import PlaylistBanner from "../client/next/components/playlists/Banner";

const sides = ['your playlists', 'shared with you', 'public playlists'];
type Test = Pick<SpringMedia, "id" | "poster" | "backdrop" | "background" | "overview" | "name" | "type" | "trailer"> & {logo: string};

export default function Test({images, media}: {images: string[], media: Test[]}) {
    useNavBar('playlists', 1);
    const [select, setSelect] = useState(sides[0]);

    return (
        <>
            <Background response={images} />
            <div className={ss.grid}>
                <ul className={ss.top}>
                    {sides.map((e, v) => <li key={v} onClick={() => setSelect(e)}
                                                className={e === select ? `${ss.li} ${ss.ac}` : ss.li}>
                        {e}
                    </li>)}
                </ul>

                <div className={sss.container}>

                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />
                        <PlaylistBanner />

                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                    <PlaylistBanner />
                </div>
            </div>
        </>
    )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const AuthService = await import("../server/classes/auth").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const SpringBoard = await import("../server/classes/springboard").then(m => m.default);

    const authService = new AuthService();
    const middleware = new MiddleWare();
    const springboard = new SpringBoard();

    const data = await middleware.readCookie(ctx.req.cookies, 'frames-cookie');
    const presentUser = await authService.getUserFromSession(data.session);
    const trending = await springboard.getTrending();

    if (presentUser?.role !== Role.ADMIN)
        return {
            notFound: true
        }

    return {
        props: {
            images: trending.map(e => e.poster).slice(0, 10),
            media: trending
        }
    }
}