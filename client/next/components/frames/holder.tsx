import {subscribe, useEventListener} from "../../../utils/customHooks";
import {
    Buffer,
    CastHolder,
    DownloadHandler,
    Overview,
    ShareFrame,
    SubDisplay,
    UpNextHolder
} from "./misc/misc";
import ss from './frames.module.css'
import ControlsHolder from "./conrols/controlHolder";
import GroupWatchHandler, {GroupWatchSlide} from "../lobby/groupWatchHandler";
import FramesPlayer from "./player/player";
import usePlaybackControls, {
    differance,
    displaySidesAtom,
    framesVideoStateAtom,
    fullscreenAddressAtom,
    PipAndFullscreenAtom
} from "../../../utils/playback";
import {useRecoilValue} from "recoil";
import Settings from "./conrols/settings";
import {Loading} from "../misc/Loader";
import {HoverContainer} from "../buttons/Buttons";
import {Conformation} from "../../../utils/notifications";
import React, {memo} from "react";

function FrameHolder({room}: { room: string | null }) {
    const diff = useRecoilValue(differance);
    const {
        showControls,
        getEverything,
        playPause,
        lobbyOpen,
        groupWatch: {updateRoom}
    } = usePlaybackControls(true);
    const {fullscreen} = useRecoilValue(PipAndFullscreenAtom);
    const controls = useRecoilValue(displaySidesAtom).controls;
    const fsADDR = useRecoilValue(fullscreenAddressAtom).fullscreen;
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
        <div id={fsADDR || ''}>
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
                            <ControlsHolder controls={controls}/>
                        </HoverContainer>
                    </>
                }
            </div>
            <Settings/>
            <ShareFrame/>
            <DownloadHandler/>
            {lobbyOpen && <GroupWatchHandler/>}
            {fullscreen && <Conformation/>}
            <GroupWatchSlide/>
        </div>
    )
}

export default memo(FrameHolder);
