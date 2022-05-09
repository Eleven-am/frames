import HomeLayout, {MetaTags} from "../client/next/components/navbar/navigation";
import {GetServerSidePropsContext} from "next";
import {useNavBar, usePreviousState} from "../client/utils/customHooks";
import {Role} from "@prisma/client";
import {SpringPlay} from "../server/classes/listEditors";
import FrameHolder from "../client/next/components/frames/holder";
import {Modals} from "../client/next/components/frames/misc/misc";
import {useEffect} from "react";
import useUser from "../client/utils/userTools";
import {Loading} from "../client/next/components/misc/Loader";
import {CookiePayload} from "../server/classes/middleware";

export default function Watch({media, metaTags, room}: { media: SpringPlay, metaTags: MetaTags, room?: string }) {
    const {user, loading, signAsGuest} = useUser();
    const prevLoading = usePreviousState(loading);
    useNavBar('watch', 1);

    useEffect(() => {
        if (!prevLoading && loading) {
            media.frame && !user && signAsGuest();
        }
    }, [media, loading, user]);

    if ((media.frame && user) || !media.frame)
        return (
            <HomeLayout meta={metaTags}>
                <FrameHolder media={media} room={room}/>
                <Modals/>
            </HomeLayout>
        )

    else return <Loading/>
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const User = await import("../server/classes/auth").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const FramesCast = await import("../server/classes/listEditors").then(m => m.FramesCast);
    const Playlist = await import("../server/classes/listEditors").then(m => m.Playlist);
    const user = new User();
    const playlist = new Playlist();
    const framesCast = new FramesCast();
    const middleware = new MiddleWare();

    const data = await middleware.confirmContent<CookiePayload>(context.req.cookies, 'frames-cookie') || {
        email: 'unknown',
        context: Role.GUEST,
        session: 'unknown',
        validUntil: 0,
    };
    console.log(data, pathname);

    const presentUser = await user.getUserFromSession(data.session);
    const userId = presentUser?.userId || 'unknown';

    if (pathname.mediaId) {
        const response = await playlist.startPlayback(+pathname.mediaId, userId, true, 'MEDIA');
        if (response) {
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/watch=' + response.location,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: response
                }
            }
        }
    } else if (pathname.episodeId) {
        const response = await playlist.startPlayback(+pathname.episodeId, userId, true, 'EPISODE');
        if (response) {
            const position = pathname.resetPosition ? 0 : response.position;
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/watch=' + response.location,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: {...response, position},
                }
            }
        }
    } else if (pathname.playlistId) {
        const response = await playlist.startPlayback(+pathname.playlistId, userId, true, 'PLAYLIST');
        if (response) {
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/watch=' + response.location,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: response
                }
            }
        }
    } else if (pathname.shuffleId) {
        const response = await playlist.shuffleMedia(+pathname.shuffleId, userId);
        const video = await playlist.startPlayback(response?.id || 0, userId, true, 'PLAYLIST');
        if (video) {
            const metaTags: MetaTags = {
                name: video.episodeName || video.name,
                overview: video.overview,
                link: '/watch=' + video.location,
                poster: video.poster
            }

            return {
                props: {
                    metaTags,
                    media: video
                }
            }
        }
    } else if (pathname.roomKey) {
        const response = await framesCast.decryptRoom(pathname.roomKey as string, userId);
        if (response) {
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/room=' + pathname.roomKey,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: response,
                    room: pathname.roomKey
                }
            }
        }

    } else if (pathname.auth) {
        const response = await playlist.getPlayBack(pathname.auth as string, userId, true);
        if (response) {
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/watch=' + response.location,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: response
                }
            }
        }
    } else if (pathname.frame) {
        const response = await framesCast.decryptCipher(pathname.frame as string);
        if (response) {
            const metaTags: MetaTags = {
                name: response.episodeName || response.name,
                overview: response.overview,
                link: '/frame=' + pathname.frame,
                poster: response.poster
            }

            return {
                props: {
                    metaTags,
                    media: response,
                }
            }
        }
    }

    return {
        notFound: true
    }
}