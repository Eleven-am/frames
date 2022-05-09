import {SpringPlay} from "../../../../server/classes/listEditors";
import {useGroupWatch} from "../../../utils/groupWatch";
import usePlayback, {
    cleanUp,
    differance,
    displaySidesAtom,
    framesVideoStateAtom,
    fullscreenAddressAtom,
    PipAndFullscreenAtom
} from "../../../utils/playback";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {useBasics, useDetectPageChange, useEventListener, useInterval} from "../../../utils/customHooks";
import NProgress from "nprogress";
import {useEffect} from "react";
import {Loading} from "../misc/Loader";
import FramesPlayer from "./player/player";
import {AlreadyStreaming, Buffer, CastHolder, Overview, SubDisplay, UpNextHolder} from "./misc/misc";
import ss from './frames.module.css'
import ControlsHolder from "./controls/controlHolder";
import {AlreadyStreamingAtom, useNotification} from "../../../utils/notificationConext";
import {GlobalModals} from "../misc/inform";
import GroupWatchHandler from "../misc/groupWatchHandler";

export default function FrameHolder({media, room}: { media: SpringPlay, room?: string }) {
    const {updateRoom, connected, lobbyOpen, openSession} = useGroupWatch();
    const diff = useRecoilValue(differance);
    const fullScreen = useRecoilValue(PipAndFullscreenAtom).fullscreen;
    const playback = usePlayback();
    const reset = cleanUp();
    const {isMounted} = useBasics();
    const setResponse = useSetRecoilState(framesVideoStateAtom);
    const controls = useRecoilValue(displaySidesAtom).controls;
    const alreadyStreaming = useRecoilValue(AlreadyStreamingAtom);
    const fsADDR = useRecoilValue(fullscreenAddressAtom);
    const {broadcastToSelf} = useNotification();
    const {loading, router} = useDetectPageChange(false, async event => {
        if (isMounted() && event.loading && !event.shallow)
            await reset();
    });

    useInterval(() => {
        if (isMounted())
            broadcastToSelf({
                type: 'streaming',
                title: 'Streaming',
                message: 'Streaming',
                data: null
            });
    }, alreadyStreaming ? 0: 10);

    useEventListener('contextmenu', (ev) => {
        ev.preventDefault();
    })

    const handleLoad = async () => {
        NProgress.done();
        setResponse(media);
        await updateRoom(media.location);
        !media.frame && room === undefined && await router.replace('/watch=' + media.location, undefined, {shallow: true});
        room && !connected && openSession({id: media.mediaId, auth: room});
        playback.showControls();
        await playback.getEverything(media);
    }

    useEffect(() => {
        if (media)
            handleLoad();
    }, [media]);

    if (loading)
        return <Loading/>;

    else if (alreadyStreaming)
        return <AlreadyStreaming/>;

    return (
        <>
            <div style={lobbyOpen ? {visibility: "hidden", opacity: 0} : controls || diff ? {} : {cursor: "none"}}
                 id={fsADDR.fullscreen || ''}>
                <UpNextHolder/>
                <FramesPlayer/>
                <CastHolder/>
                {diff ? null :
                    <>
                        <Buffer/>
                        <SubDisplay/>
                        <div className={ss.ch} onMouseMove={playback.showControls} onClick={() => playback.playPause()}>
                            <Overview/>
                            <div className={controls ? ss.cc : `${ss.cc} ${ss.mvr}`}>
                                <ControlsHolder/>
                            </div>
                        </div>
                    </>
                }
            </div>
            {fullScreen && <GlobalModals/>}
            {lobbyOpen && <GroupWatchHandler/>}
        </>
    )
}