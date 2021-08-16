import {useCallback, useEffect, useRef, useState} from "react";
import {
    bufferingAtom,
    currentDuration,
    differance,
    framesPlayer,
    mutedAtom,
    playVideoAtom,
    volumeAtom
} from "../../../states/FramesStates";
import {useRecoilValue, useSetRecoilState} from "recoil";
import cd from "../frames.module.css";
import {SpringPlay} from "../../../../server/classes/springboard";

function playing(video: HTMLVideoElement) {
    return (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 3);
}

export default function FramesPlayer({response, showInfo}: { response: SpringPlay, showInfo: (() => void) }) {
    const player = useRef<HTMLVideoElement>(null);
    const setCurrent = useSetRecoilState(currentDuration);
    const setVolume = useSetRecoilState(volumeAtom);
    const setMute = useSetRecoilState(mutedAtom);
    const setBuffer = useSetRecoilState(bufferingAtom);
    const [ready, setReady] = useState(false);
    const setPlay = useSetRecoilState(playVideoAtom);
    const diff = useRecoilValue(differance);
    const setFrames = useSetRecoilState(framesPlayer);

    useEffect(() => setFrames(player.current), [player.current])

    const volumeChange = useCallback(() => {
        if (player.current) {
            setVolume(player.current.volume)
            setMute(player.current.muted)
        }
    }, [player.current])

    const handleUpdate = useCallback(async () => {
        if (player && player.current) {
            const video = player.current;
            const current = video.currentTime;
            const duration = video.duration;
            const buffered = video.buffered;
            setCurrent({current, duration, buffered});

            if (playing(video))
                setBuffer(false);
        }
    }, [player.current])

    const durationChange = useCallback(() => {
        if (player.current) {
            const current = player.current.currentTime = (response.position / 1000) * player.current.duration;
            setCurrent({current, duration: player.current.duration, buffered: player.current.buffered});
            player.current.autoplay = true;

            let tracks = player.current.textTracks;
            for (let track of tracks)
                track.mode = "hidden";
        }
    }, [player.current])

    const playVideo = async (action: boolean) => {
        if (player.current) {
            if (action)
                try {
                    await player.current.play();
                } catch (e) {
                    setPlay(false);
                }
        }
    }

    const startPlayback = async () => {
        if (player.current) {
            showInfo();
            await playVideo(true)
            setReady(true);
        }
    }

    const playPause = (bool: boolean) => {
        showInfo();
        setPlay(bool);
    }

    return (
        <>
            <video
                id='frames-player'
                ref={player} className={diff ? cd.count : cd.frames} preload="metadata"
                src={response.cdn + response.location}
                onLoadedMetadata={startPlayback}
                onDurationChange={durationChange}
                onVolumeChange={volumeChange}
                onTimeUpdate={handleUpdate}
                onWaiting={() => setBuffer(true)}
                onPlay={() => playPause(true)}
                onPause={() => playPause(false)}/>
            <img style={ready ? {display: "none"} : {display: "block"}} className={cd.pf}
                 src={response.backdrop} alt={response.name}/>
        </>
    )
}