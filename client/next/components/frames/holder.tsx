import {subscribe, useEventListener} from "../../../utils/customHooks";
import {Buffer, CastHolder, DownloadHandler, Overview, ShareFrame, SubDisplay, UpNextHolder} from "./misc/misc";
import ss from './frames.module.css'
import ControlsHolder from "./conrols/controlHolder";
import GroupWatchHandler from "../lobby/groupWatchHandler";
import FramesPlayer from "./player/player";
import usePlaybackControls, {
    differance,
    displaySidesAtom,
    framesVideoStateAtom,
    fullscreenAddressAtom
} from "../../../utils/playback";
import {useRecoilValue} from "recoil";
import Settings from "./conrols/settings";
import {Loading} from "../misc/Loader";

export default function FrameHolder({room}: { room?: string }) {
    const diff = useRecoilValue(differance);
    const {
        showControls,
        getEverything,
        playPause,
        toggleSession,
        connected,
        lobbyOpen,
        groupWatch: {updateRoom}
    } = usePlaybackControls(true);
    const controls = useRecoilValue(displaySidesAtom).controls;
    const fsADDR = useRecoilValue(fullscreenAddressAtom);
    const media = useRecoilValue(framesVideoStateAtom);

    subscribe(async media => {
        if (media) {
            await updateRoom(media.location);
            room && !connected && await toggleSession();
            showControls();
            await getEverything(media);
        }
    }, media);

    useEventListener('contextmenu', (ev) => {
        ev.preventDefault();
    })

    if (!media) return <Loading/>;

    return (
        <div id={fsADDR.fullscreen || ''}>
            <div style={lobbyOpen ? {visibility: "hidden", opacity: 0} : controls || diff ? {} : {cursor: "none"}}>
                <UpNextHolder/>
                <FramesPlayer/>
                <CastHolder/>
                {diff ? null :
                    <>
                        <Buffer/>
                        <SubDisplay/>
                        <div className={ss.ch} onMouseMove={showControls} onClick={() => playPause()}>
                            <Overview/>
                            <div className={controls ? ss.cc : `${ss.cc} ${ss.mvr}`}>
                                <ControlsHolder/>
                            </div>
                        </div>
                    </>
                }
            </div>
            <Settings/>
            <ShareFrame/>
            <DownloadHandler/>
            {lobbyOpen && <GroupWatchHandler/>}
        </div>
    )
}