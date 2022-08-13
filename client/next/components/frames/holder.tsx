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
import {HoverContainer} from "../buttons/Buttons";

export default function FrameHolder({room}: { room: string | null }) {
    const diff = useRecoilValue(differance);
    const {
        showControls,
        getEverything,
        playPause,
        lobbyOpen,
        groupWatch: {updateRoom}
    } = usePlaybackControls(true);
    const controls = useRecoilValue(displaySidesAtom).controls;
    const fsADDR = useRecoilValue(fullscreenAddressAtom);
    const media = useRecoilValue(framesVideoStateAtom);

    subscribe(async ({media}) => {
        if (media) {
            await updateRoom(media.location);
            await getEverything(media);
            showControls();
        }
    }, {media, room});

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
                        <HoverContainer className={ss.ch} onMove={showControls} onClick={playPause}>
                            <Overview/>
                            <div className={controls ? ss.cc : `${ss.cc} ${ss.mvr}`}>
                                <ControlsHolder/>
                            </div>
                        </HoverContainer>
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
