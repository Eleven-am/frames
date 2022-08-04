import {framesPlayerStateSelector, useCentreControls} from "../../../../utils/playback";
import styles from './controls.module.css';
import LeftControls from "./left";
import RightControls from "./right";
import Progress from "./progress";
import {Subtitles, Toppers, UpNextMini} from "../misc/misc";
import {useRecoilValue} from "recoil";
import {useCallback} from "react";

export default function ControlsHolder() {
    const state = useRecoilValue(framesPlayerStateSelector);
    const {playPause, seekVideo} = useCentreControls(true);

    const currentHandler = useCallback((bool: boolean) => {
        if (bool)
            seekVideo(+10, 'add');
        else
            seekVideo(-10, 'add');
    }, [seekVideo]);

    const handlePlayPause = useCallback(async () => {
        await playPause();
    }, [playPause]);

    return (
        <>
            <Toppers/>
            <Progress/>
            <div className={styles.c}>
                <LeftControls/>
                <div className={styles.center} onClick={e => e.stopPropagation()}>
                    <button onClick={() => currentHandler(false)} className={styles.f}>
                        <svg viewBox="0 0 24 24">
                            <path
                                d="M12.5,3C17.15,3 21.08,6.03 22.47,10.22L20.1,11C19.05,7.81 16.04,5.5 12.5,5.5C10.54,5.5 8.77,6.22 7.38,7.38L10,10H3V3L5.6,5.6C7.45,4 9.85,3 12.5,3M10,12V22H8V14H6V12H10M18,14V20C18,21.11 17.11,22 16,22H14A2,2 0 0,1 12,20V14A2,2 0 0,1 14,12H16C17.11,12 18,12.9 18,14M14,14V20H16V14H14Z"/>
                        </svg>
                    </button>
                    <button className={styles.vpb} onClick={handlePlayPause}>
                        <svg
                            style={state !== 'PAUSED' ? {display: "none"} : {display: "block"}}
                            viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <polygon points="10 8 16 12 10 16 10 8"/>
                        </svg>
                        <svg
                            style={state !== 'PAUSED' ? {display: "block"} : {display: "none"}}
                            viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="10" y1="15" x2="10" y2="9"/>
                            <line x1="14" y1="15" x2="14" y2="9"/>
                        </svg>
                    </button>
                    <button onClick={() => currentHandler(true)} className={styles.f}>
                        <svg viewBox="0 0 24 24">
                            <path
                                d="M10,12V22H8V14H6V12H10M18,14V20C18,21.11 17.11,22 16,22H14A2,2 0 0,1 12,20V14A2,2 0 0,1 14,12H16C17.11,12 18,12.9 18,14M14,14V20H16V14H14M11.5,3C14.15,3 16.55,4 18.4,5.6L21,3V10H14L16.62,7.38C15.23,6.22 13.46,5.5 11.5,5.5C7.96,5.5 4.95,7.81 3.9,11L1.53,10.22C2.92,6.03 6.85,3 11.5,3Z"/>
                        </svg>
                    </button>
                </div>
                <RightControls/>
            </div>
            <UpNextMini/>
            <Subtitles/>
        </>
    )
}