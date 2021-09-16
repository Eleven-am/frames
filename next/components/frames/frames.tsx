import UpNextHolder, {UpNextMini} from "./misc/upnext";
import FramesPlayer from "./misc/player";
import {useCallback, useEffect, useRef, useState} from "react";
import usePlayback, {
    activeSubs,
    differance,
    displayInfoAtom,
    displaySidesAtom, DownOver, framesPlayer,
    framesSubtitles, GWMOver,
    InformAndAuth,
    moveSubsAtom,
    resetFrames,
    shareOver, UpNextURL
} from "../../states/FramesStates";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {Buffer, CastHolder, DownloadHandler, GroupWatchMessage, Overview, ShareFrame, Toppers} from "./misc/misc";
import Controls from "./controls/controls";
import Progress from "./controls/progress";
import ss from './frames.module.css'
import {useEventListener, useFullscreen, useIsMounted, useNavBar, usePip} from "../../utils/customHooks";
import {SubDisplay, Subtitles} from "./misc/subtitles";
import {SpringPlay} from "../../../server/classes/springboard";
import {useRouter} from "next/router";
import useGroupWatch from "../../utils/groupWatch";

function Listener({response, showInfo}: { response: SpringPlay, showInfo: (() => void) }) {
    const {seekVideo, muteUnmuteVideo, setVolume, playPause} = usePlayback();
    const [max, toggleFullscreen] = useFullscreen('frames-container');
    const setActiveSub = useSetRecoilState(activeSubs);
    const subs = useRecoilValue(framesSubtitles);
    const frames = useRecoilValue(framesPlayer);
    const speak = useRecoilValue(GWMOver);
    const down = useRecoilValue(DownOver);
    const [pip, togglePip] = usePip(frames);
    const url = useRecoilValue(UpNextURL);
    const {pushNext} = useGroupWatch();
    const router = useRouter();

    const nextHandler = async () => {
        await pushNext(url);
        await router.push(url);
    }

    useEventListener('keyup', async event => {
        if (!speak && !down){
            if (event.code === 'Space')
                await playPause()

            if (event.code === 'ArrowLeft')
                seekVideo(-30);

            if (event.code === 'ArrowRight')
                seekVideo(+30);

            if (event.code === 'KeyM')
                muteUnmuteVideo();

            if (event.code === 'KeyP')
                togglePip(!pip);

            if (event.code === 'KeyN')
                await nextHandler();

            if (event.code === 'KeyS')
                setActiveSub(activeSub => {
                    const temp = ['none'].concat(subs.map(e => e.language));
                    const index = temp.findIndex(e => e === activeSub);
                    return 0 <= index && index <= temp.length - 2 ? temp[index + 1] : temp[0];
                })

            if (event.code === 'KeyF')
                toggleFullscreen(!max);

            if (event.code === "Escape" && response)
                await router.push('/info?id=' + response.mediaId, '/' + (response.episodeName ? 'show' : 'movie') + '=' + response.name.replace(/\s/g, '+'));

            if (event.code === 'ArrowUp')
                setVolume(+0.1)

            if (event.code === 'ArrowDown')
                setVolume(-0.1)

            showInfo();
        }
    })

    return null;
}

export function Listeners ({response}: { response: SpringPlay }) {
    return(
        <>
            <GroupWatchMessage/>
            <InformAndAuth response={response}/>
            <DownloadHandler response={response}/>
            <ShareFrame location={response.location}/>
        </>
    )
}

export default function Frames({response}: { response: SpringPlay }) {
    const [mouse, setMouse] = useState(true);
    const fiveSecs = useRef<NodeJS.Timeout>();
    const {playPause} = usePlayback();
    const tenSecs = useRef<NodeJS.Timeout>();
    const isMounted = useIsMounted();
    const setSides = useSetRecoilState(displaySidesAtom);
    const setDisplay = useSetRecoilState(displayInfoAtom);
    const setMoveSub = useSetRecoilState(moveSubsAtom);
    const setShare = useSetRecoilState(shareOver);
    const diff = useRecoilValue(differance);
    const reset = resetFrames();
    useNavBar('watch', 0);

    const holderPlayPause = useCallback(async () => {
        showInfo();
        await playPause();
    }, [playPause]);

    const showInfo = useCallback(() => {
        setMouse(true);
        setMoveSub(true);
        setDisplay(false);

        fiveSecs.current && clearTimeout(fiveSecs.current);
        fiveSecs.current = setTimeout(() => {
            if (isMounted()) {
                setMouse(false);
                setMoveSub(false);
                setShare(false);
            }
        }, 5000)

        tenSecs.current && clearTimeout(tenSecs.current);
        tenSecs.current = setTimeout(() => {
            if (isMounted())
                setDisplay(true);
        }, 10000)
    }, [])

    useEffect(() => {
        showInfo()
        setTimeout(() => setSides(false), 1000)
        return () => reset();
    }, [response])

    return (
        <div id={'frames-container'} style={mouse || diff ? {} : {cursor: "none"}}>
            <UpNextHolder response={response}/>
            <FramesPlayer response={response} showInfo={showInfo}/>
            <CastHolder response={response}/>
            {diff ? null :
                <>
                    <Buffer/>
                    <SubDisplay/>
                    <div className={ss.ch}
                         onMouseMove={showInfo}
                         onClick={holderPlayPause}>

                        <Overview response={response}/>
                        <div className={mouse ? ss.cc : `${ss.cc} ${ss.mvr}`}>
                            <Toppers response={response}/>
                            <Progress/>
                            <Controls response={response}/>
                            <UpNextMini response={response}/>
                            <Subtitles response={response}/>
                        </div>
                    </div>
                </>
            }

            <Listener response={response} showInfo={showInfo}/>
        </div>
    )
}