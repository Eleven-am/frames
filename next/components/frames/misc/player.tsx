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
import useGroupWatch from "../../../utils/groupWatch";
import useCast from "../../../utils/castContext";

function playing(video: HTMLVideoElement) {
    return (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 3);
}

export default function FramesPlayer({response, showInfo}: { response: SpringPlay, showInfo: (() => void) }) {
    const player = useRef<HTMLVideoElement>(null);
    const [playback, setPLayBack] = useState(false);
    const setCurrent = useSetRecoilState(currentDuration);
    const setVolume = useSetRecoilState(volumeAtom);
    const setMute = useSetRecoilState(mutedAtom);
    const setBuffer = useSetRecoilState(bufferingAtom);
    const [ready, setReady] = useState(false);
    const setPlay = useSetRecoilState(playVideoAtom);
    const diff = useRecoilValue(differance);
    const {sendMessage} = useGroupWatch();
    const setFrames = useSetRecoilState(framesPlayer);

    useEffect(() => setFrames(player.current), [player.current])

    useEffect(() => {
        if (playback)
            sendMessage({action: 'declare'});
    }, [playback])

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

            let tracks = player.current.textTracks;
            for (let track of tracks)
                track.mode = "hidden";
        }
    }, [player.current])

    const durationChange = useCallback(() => {
        if (player.current) {
            const current = player.current.currentTime = (response.position / 1000) * player.current.duration;
            setCurrent({current, duration: player.current.duration, buffered: player.current.buffered});
            player.current.autoplay = true;
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
        bool && ready && setPLayBack(true);
    }

    return (
        <>
            <video
                id='frames-player'
                ref={player} className={diff ? cd.count : cd.frames} preload="metadata"
                onLoadedMetadata={startPlayback}
                onDurationChange={durationChange}
                onVolumeChange={volumeChange}
                onTimeUpdate={handleUpdate}
                onWaiting={() => setBuffer(true)}
                onPlay={() => playPause(true)}
                onPause={() => playPause(false)}>
                <source type="video/mp4" src={response.cdn + response.location}/>
                {response.subs.map((e, v) => <track key={v} kind="subtitles" label={e.label} srcLang={e.lang}
                                                    src={`/api/stream/pureSub?auth=${response.location}&language=${e.language}`}/>)}
            </video>
            <img style={ready ? {display: "none"} : {display: "block"}} className={cd.pf}
                 src={response.backdrop} alt={response.name}/>
        </>
    )
}