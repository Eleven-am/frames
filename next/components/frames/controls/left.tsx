import React, {useEffect, useRef, useState} from "react";
import styles from './controls.module.css';
import {useRecoilValue, useSetRecoilState} from "recoil";
import usePlayback, {displaySidesAtom, mutedSelector, shareOver, volumeWidth} from "../../../states/FramesStates";
import useCast from "../../../utils/castContext";
import useUser from "../../../utils/userTools";
import {Role} from '@prisma/client';
import {SpringPlay} from "../../../../server/classes/springboard";
import {useIsMounted} from "../../../utils/customHooks";

export default function Left({response}: { response: SpringPlay }) {
    const twoSecs = useRef<NodeJS.Timeout>();
    const {connected: castConnected, castMedia, available, connect, disconnect} = useCast();
    const {frames: video, muteUnmuteVideo, setVolume} = usePlayback();
    const sides = useRecoilValue(displaySidesAtom);
    const width = useRecoilValue(volumeWidth);
    const mute = useRecoilValue(mutedSelector);
    const setShare = useSetRecoilState(shareOver);
    const isMounted = useIsMounted();
    const [airPlay, setAirplay] = useState(false);
    const [connected, setConnected] = useState(false);
    const [volumeChange, setVolumeChange] = useState(false);
    const {user} = useUser();

    useEffect(() => {
        if (castConnected && isMounted()) {
            castMedia(video!, {
                backdrop: response.backdrop,
                location: response.cdn + response.location,
                name: response.name,
                logo: response.logo
            })
        }
    }, [castConnected, response])

    useEffect(() => {
        !sides && setVolumeChange(true);
        twoSecs.current && clearTimeout(twoSecs.current);
        twoSecs.current = setTimeout(() => setVolumeChange(false), 2000)
    }, [mute, width])

    useEffect(() => {
        if (video)
            if (window.WebKitPlaybackTargetAvailabilityEvent) {
                video.addEventListener('webkitplaybacktargetavailabilitychanged', function (event: any) {
                    switch (event.availability) {
                        case "available":
                            setAirplay(true);
                            break;
                        case "not-available":
                            setAirplay(false);
                            break;
                    }
                });

                video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', function (event: any) {
                    if (event.target.remote.state === "connected")
                        setConnected(true);
                    else
                        setConnected(false);
                });
            }

        return () => {
            video?.removeEventListener('webkitplaybacktargetavailabilitychanged', (event: any) => {
                switch (event.availability) {
                    case "available":
                        setAirplay(true);
                        break;
                    case "not-available":
                        setAirplay(false);
                        break;
                }
            })

            video?.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', (event: any) => {
                if (event.target?.remote?.state === "connected")
                    setConnected(true);
                else
                    setConnected(false);
            })
        }
    }, [video])

    const handleWidthClick = (event: React.MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget!.getBoundingClientRect();
        const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
        setVolume(pos, false);
    }

    const handleAirPlay = async () => {
        if (video && video.webkitShowPlaybackTargetPicker)
            await video.webkitShowPlaybackTargetPicker();
    }

    const handleCast = async () => {
        if (available) {
            if (!castConnected)
                connect()
            else
                disconnect();
        }
    }

    return (
        <div style={sides || volumeChange ? {opacity: 1} : {}} className={`${styles.a} ${styles.left}`}
             onClick={e => e.stopPropagation()}>
            {airPlay || available ?
                <button className={connected || castConnected ? `${styles.nf} ${styles.con}` : styles.nf}>
                    <svg onClick={handleAirPlay} style={airPlay ? {display: "block"} : {display: "none"}}
                         viewBox="0 0 24 24">
                        <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
                        <polygon points="12 15 17 21 7 21 12 15"/>
                    </svg>
                    <svg onClick={handleCast} style={available ? {display: "block"} : {display: "none"}}
                         viewBox="0 0 24 24">
                        <path
                            d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                        <line x1="2" y1="20" x2="2.01" y2="20"/>
                    </svg>
                </button> : null}
            {user && user.role !== Role.GUEST ? <button className={styles.nf} onClick={() => {
                setShare(share => !share)
            }}>
                <svg viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
            </button> : null}
            <button onClick={muteUnmuteVideo} className={mute ? `${styles.f} ${styles.muted}` : styles.f}>
                <svg viewBox="0 0 24 24">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
            </button>
            <div className={styles.vg} onClick={event => handleWidthClick(event)}>
                <div className={mute ? `${styles.vf} ${styles.muted}` : styles.vf} style={{width}}/>
                <div className={styles.vh}/>
            </div>
            {user && user.role !== Role.GUEST ? <button className={`${styles.f} ${styles.download}`}>
                <svg viewBox="0 0 299.998 299.998">
                    <g>
                        <path d="M149.995,0C67.156,0,0,67.159,0,149.997c0,82.837,67.156,150,149.995,150s150.003-67.163,150.003-150
                            C299.997,67.159,232.834,0,149.995,0z M110.967,105.357c2.075-2.075,4.793-3.112,7.511-3.112c2.718,0,5.434,1.037,7.508,3.112
                            l13.297,13.295v-3.911V62.477c0-5.867,4.754-10.621,10.621-10.621s10.621,4.754,10.621,10.621v52.263v4.63l4.63-4.63l9.386-9.384
                            c2.075-2.075,4.79-3.112,7.508-3.112s5.436,1.037,7.511,3.112c2.552,2.549,3.522,6.079,2.933,9.384
                            c0,0.003-0.003,0.005-0.003,0.008c-0.044,0.239-0.119,0.469-0.179,0.703c-0.091,0.366-0.189,0.729-0.322,1.084
                            c-0.088,0.239-0.189,0.472-0.296,0.705c-0.166,0.371-0.358,0.726-0.568,1.079c-0.112,0.187-0.215,0.373-0.34,0.552
                            c-0.363,0.524-0.76,1.032-1.227,1.499l-15.115,15.115l-16.591,16.591c-2.077,2.075-4.793,3.105-7.508,3.105
                            c-0.026,0-0.052,0-0.078,0s-0.054,0-0.078,0c-2.715,0-5.431-1.03-7.508-3.105l-16.591-16.591l-15.115-15.115
                            c-0.467-0.467-0.864-0.973-1.222-1.496c-0.127-0.184-0.231-0.373-0.345-0.56c-0.207-0.35-0.397-0.703-0.563-1.069
                            c-0.109-0.239-0.213-0.475-0.301-0.718c-0.127-0.348-0.223-0.7-0.314-1.056c-0.062-0.246-0.143-0.485-0.187-0.734
                            C107.444,111.436,108.412,107.906,110.967,105.357z M231.574,209.315h-0.003c0,14.337-14.057,25.568-32.005,25.568h-99.132
                            c-17.945,0-32.005-11.23-32.005-25.568V140.31c0-12.117,10.058-21.988,24.004-24.761c0.604,5.981,3.224,11.526,7.534,15.834
                            l4.108,4.108h-3.641c-7.265,0-11.256,3.621-11.256,4.819v69.005c0,1.201,3.992,4.819,11.256,4.819h99.135
                            c7.265,0,11.256-3.621,11.256-4.819V140.31c0-1.198-3.992-4.819-11.256-4.819h-3.12l4.111-4.111
                            c4.282-4.279,6.894-9.786,7.516-15.727c13.681,2.913,23.498,12.69,23.498,24.66V209.315z"/>
                    </g>
                </svg>
            </button> : null}
        </div>
    )
}