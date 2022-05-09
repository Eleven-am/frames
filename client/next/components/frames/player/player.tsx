import {useRecoilValue, useSetRecoilState} from "recoil";
import usePlayback, {differance, framesPlayer, framesVideoStateAtom, HideImageAtom} from "../../../../utils/playback";
import {useEffect, useRef} from "react";
import cd from './frames.module.css';

export default function FramesPlayer() {
    const setFrames = useSetRecoilState(framesPlayer);
    const response = useRecoilValue(framesVideoStateAtom);
    const hideImage = useRecoilValue(HideImageAtom);
    const player = useRef<HTMLVideoElement | null>(null);
    const diff = useRecoilValue(differance);
    const playback = usePlayback();

    useEffect(() => setFrames(player.current), [player.current])

    if (response === null)
        return null;

    return (
        <>
            <video
                id={response.playerId}
                onTimeUpdate={playback.handleTimeUpdate}
                onLoadedMetadata={playback.handleLoadedMetadata}
                onDurationChange={playback.handleDurationChange}
                onEnded={playback.handleEnded}
                onWaiting={playback.handleWaiting}
                onVolumeChange={playback.handleVolumeChange}
                onError={playback.handleError}
                onPlay={playback.handlePlayPause}
                onPause={playback.handlePlayPause}
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