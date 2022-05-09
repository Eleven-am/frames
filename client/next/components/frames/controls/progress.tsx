import {useRecoilValue} from "recoil";
import usePlayback, {PlaybackDisplayInformation} from "../../../../utils/playback";
import styles from '../Controls.module.css';
import React from "react";

export default function Progress() {
    const {timeViewed, timeRemaining, currentWidth, bufferedWidth} = useRecoilValue(PlaybackDisplayInformation)
    const {seekVideo} = usePlayback();

    const handleWidthClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const rect = event.currentTarget!.getBoundingClientRect();
        const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
        seekVideo(pos, 'multiply')
    }

    return (
        <div className={styles.a} onClick={event => event.stopPropagation()}>
            <div className={styles.b}>{timeViewed}</div>
            <div className={styles.c} onClick={handleWidthClick}>
                <div style={{width: currentWidth}} className={styles.d}/>
                <div className={styles.e}/>
                <div style={{width: bufferedWidth}} className={styles.dl}/>
            </div>
            <div className={styles.b}>{timeRemaining}</div>
        </div>
    )
}