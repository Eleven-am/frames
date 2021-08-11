import styles from '../Controls.module.css';
import {useRecoilValue} from "recoil";
import React from "react";
import usePlayback, {bufferedAtom, playWidthAtom, timeStampsAtom} from "../../../states/FramesStates";

export default function Progress() {
    const {timeViewed: start, timeRemaining: end} = useRecoilValue(timeStampsAtom);
    const width = useRecoilValue(playWidthAtom);
    const loaded = useRecoilValue(bufferedAtom);
    const {seekVideo} = usePlayback();

    const handleWidthClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const rect = event.currentTarget!.getBoundingClientRect();
        const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
        seekVideo(pos, false)
    }

    return (
        <div className={styles.a} onClick={event => event.stopPropagation()}>
            <div className={styles.b}>{start}</div>
            <div className={styles.c} onClick={handleWidthClick}>
                <div style={{width}} className={styles.d}/>
                <div className={styles.e}/>
                <div style={{width: loaded}} className={styles.dl}/>
            </div>
            <div className={styles.b}>{end}</div>
        </div>
    )
}