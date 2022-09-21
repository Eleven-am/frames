import {useRecoilValue} from "recoil";
import {PlaybackDisplayInformation, useCentreControls} from "../../../../utils/playback";
import styles from '../Controls.module.css';
import {memo, useCallback, MouseEvent} from "react";
import {useDraggable} from "../../../../utils/customHooks";

function Progress() {
    const {seekVideo} = useCentreControls(true);
    const {dragWidth, handleMouseDown, handleMouseMove, handleMouseUp} = useDraggable(pos => {
        seekVideo(pos, 'multiply')
    });
    const {timeViewed, timeRemaining, currentWidth, bufferedWidth} = useRecoilValue(PlaybackDisplayInformation)

    const handleWidthClick = useCallback((event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const rect = event.currentTarget!.getBoundingClientRect();
        const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
        seekVideo(pos, 'multiply')
    }, [seekVideo])


    return (
        <div className={styles.a} onClick={event => event.stopPropagation()}>
            <div className={styles.b}>{timeViewed}</div>
            <div className={styles.c} onClick={handleWidthClick}>
                <div style={{width: dragWidth || currentWidth}} className={styles.d}/>
                <div className={styles.e}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                />
                <div style={{width: bufferedWidth}} className={styles.dl}/>
            </div>
            <div className={styles.b}>{timeRemaining}</div>
        </div>
    )
}

export default memo(Progress);
