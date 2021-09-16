import ss from '../misc.module.css';
import style from './misc.module.css';

import {BackButton} from "../../buttons/Buttons";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    bufferingSelector,
    differance,
    displayInfoAtom,
    DownOver,
    FramesInformAtom,
    GWMOver,
    moveSubsAtom,
    playingSelector,
    shareOver
} from "../../../states/FramesStates";
import {SpringPlay} from "../../../../server/classes/springboard";
import {pFetch} from "../../../utils/baseFunctions";
import {generateKey} from "../../../../server/base/baseFunctions";
import {useCallback, useEffect, useRef} from "react";
import useCast from "../../../utils/castContext";
import cd from "../frames.module.css";
import {InformDisplayContext} from "../../misc/inform";
import useGroupWatch from "../../../utils/groupWatch";
import {useAuth, useEventListener} from "../../../utils/customHooks";

export const Toppers = ({response}: { response: SpringPlay }) => {
    return (
        <>
            <BackButton response={response}/>
            <div className={ss.ci}>
                {response?.logo ? <img src={response?.logo || ''} alt={response?.name}/> :
                    <span>{response?.name}</span>}
            </div>
        </>
    )
}

export const Buffer = () => {
    const buffer = useRecoilValue(bufferingSelector);
    const {sendMessage} = useGroupWatch();

    useEffect(() => {
        sendMessage({action: "buffering", data: buffer});
    }, [buffer])

    return (
        <div className={ss.vd} style={buffer ? {visibility: "visible"} : {visibility: "hidden"}}>
            <div className={ss.buffer}>Loading...</div>
        </div>
    )
}

export const Overview = ({response}: { response: SpringPlay }) => {
    const display = useRecoilValue(displayInfoAtom);
    const play = useRecoilValue(playingSelector);

    return (
        <div className={!play && display ? ss.vi : `${ss.hide} ${ss.vi}`}>
            <div className={!play && display ? `${ss.slideRight} ${ss.inf}` : `${ss.slideLeft} ${ss.inf}`}>
                <label className={ss.title}>{response?.name}</label>
                <div className={ss.spacer}/>
                <span className={ss.epi}>{response?.episodeName}</span>
                <div className={ss.spacer}/>
                <span className={ss.ovr}>{response?.overview}</span>
            </div>
        </div>
    )
}

export const ShareFrame = ({location}: { location: string }) => {
    const [value, setValue] = useRecoilState(shareOver);
    const dispatch = useSetRecoilState(InformDisplayContext);
    const {current, duration} = useRecoilValue(FramesInformAtom);
    const response = useRef<string>();
    const base = typeof Window !== "undefined" ? window.location.protocol + '//' + window.location.host + '/frame=' : '';

    useEffect(() => {
        response.current = generateKey(1, 13);
    }, [])

    const copy = useCallback(async () => {
        navigator.clipboard.writeText(base + response.current)
            .then(() => {
                dispatch({
                    type: "alert",
                    heading: 'Copy Successful',
                    message: 'Video url copied successfully'
                })
            })
            .catch((error) => {
                dispatch({
                    type: "error",
                    heading: 'Something went wrong',
                    message: error as string
                })
            })
    }, [base, response])

    const sendZero = async (inform: boolean) => {
        await copy();
        let position = 0;

        if (inform)
            position = (current / duration) * 1000;

        await pFetch({cypher: response.current, position, auth: location}, '/api/stream/genCypher');
        response.current = generateKey(1, 13);
    }

    return (
        <div className={style.sc}
             style={value ? {left: '2vw', visibility: "visible"} : {left: '2vw', opacity: 0, visibility: "hidden"}}
             onClick={e => e.stopPropagation()}>
            <div className={style.sm}>
                <span>Share from current position ?</span>
                <input type="text" value={base + response.current} className={style.so} readOnly/>
            </div>
            <ul className={style.sl} onClick={() => setValue(false)}>
                <li className={style.accept} onClick={() => sendZero(true)}>yes</li>
                <li className={style.reject} onClick={() => sendZero(false)}>no</li>
            </ul>
        </div>
    )
}

export function GroupWatchMessage() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useRecoilState(GWMOver);
    const {sendMessage} = useGroupWatch();

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            handleClick();
    })

    const handleClick = () => {
        setValue(false);
        const state = inputRef.current?.value;
        sendMessage({action: 'says', data: state});
        if (inputRef.current)
            inputRef.current.value = '';
    }

    return (
        <div className={style.sc}
             style={value ? {right: '2vw', visibility: "visible"} : {right: '2vw', opacity: 0, visibility: "hidden"}}
             onClick={e => e.stopPropagation()}>
            <div className={style.sm}>
                <span>Message the GroupWatch session</span>
                <input className={style.gwm} maxLength={280} ref={inputRef}/>
            </div>
            <ul className={style.sl} onClick={() => setValue(false)}>
                <li className={style.accept} onClick={handleClick}>send</li>
                <li className={style.reject}>dismiss</li>
            </ul>
        </div>
    )
}

export const DownloadHandler = ({response}: { response: SpringPlay }) => {
    const [value, setValue] = useRecoilState(DownOver);
    const {auth, setAuth, authError, valid, error} = useAuth();

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            handleClick();
    })

    const handleClick = async () => {
        if (valid) {
            setAuth('');
            setValue(false);
            const path: {location: string|null} = await pFetch({auth: response.location, authKey: auth}, '/api/stream/getDown');
            if (path.location)
                window.location.href = response.cdn + path.location;
        }
    }

    return (
        <div className={style.sc}
             style={value ? {left: '10vw', visibility: "visible"} : {left: '10vw', opacity: 0, visibility: "hidden"}}
             onClick={e => e.stopPropagation()}>
            <div className={style.sm}>
                <span style={error? {color: "rgba(245, 78, 78, .9)"}: {}}>{error? error: !valid ? 'enter an auth key': 'auth key accepted'}</span>
                <input style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                    className={style.gwm} value={auth} maxLength={23} onChange={e => setAuth(e.currentTarget.value)}/>
            </div>
            <ul className={style.sl} onClick={() => setValue(false)}>
                <li className={style.accept} onClick={handleClick}>download</li>
                <li className={style.reject}>dismiss</li>
            </ul>
        </div>
    )
}

export function CastHolder({response}: { response: SpringPlay }) {
    const move = useRecoilValue(moveSubsAtom);
    const diff = useRecoilValue(differance);
    const {connected, device} = useCast();

    if (connected)
        return (
            <>
                <img style={{display: "block"}} className={diff ? cd.count : cd.pf} src={response.backdrop}
                     alt={response.name}/>
                <div className={diff ? cd.count : style.ch}>
                    {diff ?
                        <div>
                            <svg viewBox="0 0 24 24" className={style.diffSvg}>
                                <path
                                    d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                                <line x1="2" y1="20" x2="2.01" y2="20"/>
                            </svg>
                            <br/>
                            <span>Currently casting to: {device}</span>
                        </div> :
                        <div className={style.cHold} style={move ? {bottom: '12vh'} : {}}>
                            <div className={ss.ci}>
                                {response?.logo ? <img src={response?.logo || ''} alt={response?.name}/> :
                                    <span>{response?.name}</span>}
                            </div>
                            <svg viewBox="0 0 24 24">
                                <path
                                    d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                                <line x1="2" y1="20" x2="2.01" y2="20"/>
                            </svg>
                            <ul>
                                <li style={{fontSize: "20px"}}>Currently
                                    casting {response.episodeName || response.name}</li>
                                <li style={{fontSize: "small"}}>to: {device}</li>
                            </ul>
                        </div>}
                </div>
            </>
        )

    else return null;
}