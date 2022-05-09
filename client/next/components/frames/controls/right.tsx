import styles from './controls.module.css';
import {useRecoilValue, useSetRecoilState} from "recoil";
import usePlayback, {
    displaySidesAtom,
    framesVideoStateAtom,
    PipAndFullscreenAtom,
    SubtitlesAndUpNextAtom
} from "../../../../utils/playback";
import {GroupWatchSide, useGroupWatch} from "../../../../utils/groupWatch";
import useUser from "../../../../utils/userTools";
import {Role} from "@prisma/client";
import {useBasics} from "../../../../utils/customHooks";
import {useInfoDispatch} from "../../misc/inform";

export default function RightControls() {
    const {isTabOrMobile} = useBasics();
    const {right} = useRecoilValue(displaySidesAtom);
    const {pip, fullscreen} = useRecoilValue(PipAndFullscreenAtom);
    const response = useRecoilValue(framesVideoStateAtom);
    const setSpeak = useSetRecoilState(GroupWatchSide);
    const setSubtitlesAndUpNext = useSetRecoilState(SubtitlesAndUpNextAtom);
    const dispatch = useInfoDispatch();
    const {connected, openSession} = useGroupWatch();
    const playback = usePlayback();
    const {user} = useUser();

    const subLeave = () => setTimeout(() => setSubtitlesAndUpNext(prev => ({...prev, subtitles: false})), 200);
    const subEnter = () => setSubtitlesAndUpNext(prev => ({...prev, subtitles: true}));

    const upNextLeave = () => setTimeout(() => setSubtitlesAndUpNext(prev => ({...prev, upNext: false})), 200);
    const upNextEnter = () => setSubtitlesAndUpNext(prev => ({...prev, upNext: true}));

    if (!response) return null;

    return (
        <div style={isTabOrMobile() || right ? {opacity: 1} : {}} className={`${styles.a} ${styles.right}`}
             onClick={e => e.stopPropagation()}>
            <button className={styles.nf} onClick={() => dispatch({
                type: 'error',
                heading: 'Feature not available',
                message: 'This feature is not yet available.'
            })}>
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path
                        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            </button>

            {connected ? <button className={styles.nf} onClick={() => setSpeak(true)}>
                <svg viewBox="0 0 24 24">
                    <path
                        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
            </button> : null}

            {user?.role === Role.GUEST ? null :
                <button onClick={() => openSession({id: response?.mediaId, location: response?.location})} className={connected ? `${styles.nf} ${styles.con}` : styles.nf}>
                    <svg viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </button>}

            <button className={styles.nf}>
                <svg onClick={() => playback.togglePip(false)} viewBox="0 0 24 24"
                     style={pip ? {display: "block"} : {display: "none"}}>
                    <polyline points="7 13 12 18 17 13"/>
                    <polyline points="7 6 12 11 17 6"/>
                </svg>
                <svg onClick={() => playback.togglePip(true)} viewBox="0 0 24 24"
                     style={!pip ? {display: "block"} : {display: "none"}}>
                    <polyline points="17 11 12 6 7 11"/>
                    <polyline points="17 18 12 13 7 18"/>
                </svg>
            </button>

            <button className={styles.f} onMouseLeave={subLeave} onMouseEnter={subEnter}>
                <svg viewBox="0 -71 512 512">
                    <path
                        d="m407 0h-302c-57.898438 0-105 47.101562-105 105v160.679688c0 57.894531 47.101562 105 105 105h302c57.898438 0 105-47.105469 105-105v-160.679688c0-57.898438-47.101562-105-105-105zm75 265.679688c0 41.351562-33.644531 75-75 75h-302c-41.355469 0-75-33.648438-75-75v-160.679688c0-41.355469 33.644531-75 75-75h302c41.355469 0 75 33.644531 75 75zm0 0"/>
                    <path
                        d="m399.804688 117.316406h-197.113282c-8.285156 0-15 6.714844-15 15s6.714844 15 15 15h197.113282c8.285156 0 15-6.714844 15-15s-6.714844-15-15-15zm0 0"/>
                    <path
                        d="m112.195312 147.316406h45.722657c8.285156 0 15-6.714844 15-15s-6.714844-15-15-15h-45.722657c-8.285156 0-15 6.714844-15 15s6.714844 15 15 15zm0 0"/>
                    <path
                        d="m112.195312 200.339844h197.113282c8.285156 0 15-6.71875 15-15 0-8.285156-6.714844-15-15-15h-197.113282c-8.285156 0-15 6.714844-15 15 0 8.28125 6.714844 15 15 15zm0 0"/>
                    <path
                        d="m399.804688 170.339844h-45.722657c-8.285156 0-15 6.714844-15 15 0 8.28125 6.714844 15 15 15h45.722657c8.285156 0 15-6.71875 15-15 0-8.285156-6.714844-15-15-15zm0 0"/>
                    <path
                        d="m399.804688 223.359375h-197.113282c-8.285156 0-15 6.71875-15 15 0 8.285156 6.714844 15 15 15h197.113282c8.285156 0 15-6.714844 15-15 0-8.28125-6.714844-15-15-15zm0 0"/>
                    <path
                        d="m157.917969 223.359375h-45.722657c-8.285156 0-15 6.71875-15 15 0 8.285156 6.714844 15 15 15h45.722657c8.285156 0 15-6.714844 15-15 0-8.28125-6.714844-15-15-15zm0 0"/>
                </svg>
            </button>

            {response?.frame && user?.role === Role.GUEST ? null :
                <button className={styles.f} onClick={playback.playNext} onMouseEnter={upNextEnter}
                        onMouseLeave={upNextLeave}>
                    <svg viewBox="0 0 24 24">
                        <polyline points="13 17 18 12 13 7"/>
                        <polyline points="6 17 11 12 6 7"/>
                    </svg>
                </button>}

            <button className={styles.nf}>
                <svg onClick={() => playback.toggleFS(true)}
                     style={!fullscreen ? {display: "block"} : {display: "none"}}
                     viewBox="0 0 24 24">
                    <path
                        d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3">
                    </path>
                </svg>
                <svg onClick={() => playback.toggleFS(false)}
                     style={!fullscreen ? {display: "none"} : {display: "block"}}
                     viewBox="0 0 24 24">
                    <path
                        d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3">
                    </path>
                </svg>
            </button>
        </div>
    )
}