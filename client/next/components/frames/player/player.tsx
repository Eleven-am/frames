import {useRecoilValue, useSetRecoilState} from "recoil";
import {differance, framesPlayer, HideImageAtom, usePlaybackControlsListener} from "../../../../utils/playback";
import {useEffect, useRef} from "react";
import cd from './frames.module.css';

export default function FramesPlayer() {
    const setFrames = useSetRecoilState(framesPlayer);
    const hideImage = useRecoilValue(HideImageAtom);
    const player = useRef<HTMLVideoElement | null>(null);
    const diff = useRecoilValue(differance);
    const {
        handleLoadedMetadata,
        handleEnded,
        handleDurationChange,
        handleVolumeChange,
        handlePlayPause,
        handleTimeUpdate,
        handleWaiting,
        handleError,
        response
    } = usePlaybackControlsListener(true);

    useEffect(() => {
        setFrames(player.current)
        return () => {
            setFrames(null)
        }
    }, [player.current]);

    if (response === null)
        return null;

    return (
        <>
            <video
                id={response.playerId}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onDurationChange={handleDurationChange}
                onEnded={handleEnded}
                onWaiting={handleWaiting}
                onVolumeChange={handleVolumeChange}
                onError={handleError}
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                ref={player} className={diff ? cd.count : cd.frames} preload="metadata"
            >
                <source src={response.cdn + response.location} type="video/mp4"/>
                {response.subs.map((e, v) => <track key={v} kind="subtitles" label={e.label} srcLang={e.lang}
                                                    src={`/api/stream/pureSub?auth=${response.location}&language=${e.language}`}/>)}
            </video>
            <img style={hideImage ? {display: "none"} : {display: "block"}} className={cd.pf}
                 src={response.backdrop} alt={response.name}/>
        </>
    )
}