import ss from '../misc.module.css';
import style from './misc.module.css';
import {BackButton, FramesButton} from "../../buttons/Buttons";
import {useRecoilState, useRecoilValue} from "recoil";
import React, {memo, useEffect, useMemo, useState} from "react";
import cd from "../frames.module.css";
import {
    differance,
    displaySidesAtom,
    FramesInformAtom,
    framesPlayer,
    framesPlayerStateSelector,
    framesSubtitlesAtom,
    framesVideoStateAtom,
    shareAndDownloadAtom,
    SubtitlesAndUpNextAtom,
    SubtitlesAtom,
    UpNextAtom,
    useRightControls,
} from "../../../../utils/playback";
import useCast, {VideoStateAtom} from "../../../../utils/castContext";
import {useBasics, useClipboard, useEventListener} from "../../../../utils/customHooks";
import Media from "../../entities/singleEntity/media";
import styles from "../../buttons/Button.module.css";
import {Link} from "../../misc/Loader";
import useNotifications, {AlreadyStreamingAtom} from "../../../../utils/notifications";
import {useAuth} from "../../auth/authContext";
import useBase from "../../../../utils/provider";

export const Toppers = memo(() => {
    const response = useRecoilValue(framesVideoStateAtom);
    if (!response) return null;

    return (
        <>
            <BackButton response={response}/>
            <div className={ss.ci}>
                {
                    response?.logo ? <img src={response?.logo || ''} alt={response?.name}/> :
                        <span>{response?.name}</span>
                }
                {response?.episodeName ? <div className={ss.ep}>{response?.episodeName}</div> : null}
            </div>
        </>
    )
})

export const Buffer = memo(() => {
    const response = useRecoilValue(framesVideoStateAtom);
    const state = useRecoilValue(framesPlayerStateSelector);

    return (
        <>
            <div className={ss.vd}
                 style={state === 'BUFFERING' || state === 'NOT_STARTED' || state === 'FAILED_TO_START' ?
                     {visibility: "visible"} : {visibility: "hidden"}}>
                {state === 'FAILED_TO_START' ? <div className={ss.ci}>
                    {
                        response?.logo ? <img src={response?.logo || ''} alt={response?.name}/> :
                            <span>{response?.name}</span>
                    }
                    {response?.episodeName ? <div className={ss.ep}>{response?.episodeName}</div> : null}
                </div> : <div className={ss.buffer}>Loading...</div>}
            </div>
            {state === 'PAUSED' && <svg className={`${style.flashSVG} ${style.flash}`} viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>}
            {state !== 'PAUSED' && <svg className={`${style.flashSVG} ${state === 'FAILED_TO_START' ? '' : style.flash}`}
                                                                        style={state === 'FAILED_TO_START' ? {visibility: "visible", opacity: .8} : {}}
                                                                        viewBox="0 0 494.148 494.148">
                <g>
                    <path d="M405.284,201.188L130.804,13.28C118.128,4.596,105.356,0,94.74,0C74.216,0,61.52,16.472,61.52,44.044v406.124
            c0,27.54,12.68,43.98,33.156,43.98c10.632,0,23.2-4.6,35.904-13.308l274.608-187.904c17.66-12.104,27.44-28.392,27.44-45.884
            C432.632,229.572,422.964,213.288,405.284,201.188z" data-original="#000000" className="active-path"
                          data-old_color="#000000"/>
                </g>
            </svg>}
        </>
    )
})

export const Overview = memo(() => {
    const response = useRecoilValue(framesVideoStateAtom);
    const display = useRecoilValue(displaySidesAtom).info;
    const paused = useRecoilValue(framesPlayerStateSelector) === 'PAUSED';

    return (
        <div className={paused && display ? ss.vi : `${ss.hide} ${ss.vi}`}>
            <div className={paused && display ? `${ss.slideRight} ${ss.inf}` : `${ss.slideLeft} ${ss.inf}`}>
                <label className={ss.title}>{response?.name}</label>
                <div className={ss.spacer}/>
                <span className={ss.epi}>{response?.episodeName}</span>
                <div className={ss.spacer}/>
                <span className={ss.ovr}>{response?.overview}</span>
            </div>
        </div>
    )
})

export const ShareFrame = memo(() => {
    const {copy} = useClipboard();
    const base = useBase();
    const {getBaseUrl} = useBasics();
    const data = useRecoilValue(framesVideoStateAtom);
    const [value, setValue] = useRecoilState(shareAndDownloadAtom);
    const {current, duration} = useRecoilValue(FramesInformAtom);
    const [frame, setFrame] = useState(base.generateKey(13, 1) || '');
    const [shareUrl, setShareUrl] = useState(`${getBaseUrl()}/frame=${frame}`);

    const sendZero = async (inform: boolean) => {
        if (frame === '' && base) {
            setFrame(base.generateKey(13, 1));
            setShareUrl(`${getBaseUrl()}/frame=${frame}`);
        }

        if (frame !== '' && base) {
            await copy(shareUrl, 'Video url copied successfully');
            let position = 0;
            if (inform)
                position = Math.ceil((current / duration) * 1000);

            await base.makeRequest('/api/stream/genCypher', {
                cypher: frame,
                position,
                auth: data?.location
            }, 'POST');

            setFrame(base.generateKey(13, 1));
            setShareUrl(`${getBaseUrl()}/frame=${frame}`);
        }
    }

    return (
        <div className={style.sc}
             style={value.share ? {left: '2vw', visibility: "visible"} : {
                 left: '2vw',
                 opacity: 0,
                 visibility: "hidden"
             }}
             onClick={e => e.stopPropagation()}>
            <div className={style.sm}>
                <span>Share from current position ?</span>
                <input type="text" value={shareUrl} className={style.so} readOnly/>
            </div>
            <ul className={style.sl} onClick={() => setValue({...value, share: false})}>
                <li className={style.accept} onClick={() => sendZero(true)}>yes</li>
                <li className={style.reject} onClick={() => sendZero(false)}>no</li>
            </ul>
        </div>
    )
})

export const DownloadHandler = memo(() => {
    const base = useBase();
    const data = useRecoilValue(framesVideoStateAtom);
    const [value, setValue] = useRecoilState(shareAndDownloadAtom);
    const {auth, setAuth, authError, valid, error} = useAuth();

    useEventListener('keyup', async event => {
        if (event.code === 'Enter')
            await handleClick();
    })

    const handleClick = async () => {
        if (valid && base) {
            setAuth('');
            const path = await base.makeRequest<{ location: string | null }>('/api/stream/getDown', {
                authKey: auth,
                auth: data?.location
            }, 'POST');
            if (path?.location)
                window.location.href = data?.cdn + path.location;
        }
    }

    return (
        <div className={style.sc}
             style={value.download ? {left: '10vw', visibility: "visible"} : {
                 left: '10vw',
                 opacity: 0,
                 visibility: "hidden"
             }}
             onClick={e => e.stopPropagation()}>
            <div className={style.sm}>
                <span
                    style={error ? {color: "rgba(245, 78, 78, .9)"} : {}}>{error ? error : !valid ? 'enter an auth key' : 'auth key accepted'}</span>
                <input
                    style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                    className={style.gwm} value={auth} maxLength={24} onChange={e => setAuth(e.currentTarget.value)}/>
            </div>
            <ul className={style.sl} onClick={() => setValue({...value, download: false})}>
                <li className={style.accept} onClick={handleClick}>download</li>
                <li className={style.reject}>dismiss</li>
            </ul>
        </div>
    )
})

export const CastHolder = memo(() => {
    const response = useRecoilValue(framesVideoStateAtom);
    const move = useRecoilValue(displaySidesAtom).controls;
    const diff = useRecoilValue(differance);
    const player = useRecoilValue(framesPlayer);
    const playerState = useRecoilValue(framesPlayerStateSelector);
    const [state, setState] = useRecoilState(VideoStateAtom);
    const {connected, device, castMedia} = useCast();

    useEffect(() => {
        if (connected && response && player) {
            castMedia({
                currentTime: player.currentTime,
                src: response.cdn + response.location,
                paused: player.paused, volume: player.volume
            }, {
                backdrop: response.backdrop,
                location: response.cdn + response.location,
                name: response.name, logo: response.logo
            });
            player.muted = true;
            player.pause();
        } else if (!connected && player && playerState !== 'NOT_STARTED') {
            player.muted = false;
            player.currentTime = state?.time || player.currentTime;
            player.play();

            setState(null);
        }
    }, [connected, castMedia, response, player]);

    if (connected)
        return (
            <>
                <img style={{display: "block"}} className={diff ? cd.count : cd.pf} src={response?.backdrop}
                     alt={response?.name}/>
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
                                <li style={{fontSize: "20px"}}>
                                    Currently casting {response?.episodeName || response?.name}</li>
                                <li style={{fontSize: "small"}}>to: {device}</li>
                            </ul>
                        </div>}
                </div>
            </>
        )

    else return null;
})

export const UpNextHolder = memo(() => {
    const response = useRecoilValue(framesVideoStateAtom);
    const diff = useRecoilValue(differance);
    const data = useRecoilValue(UpNextAtom);

    const asPath = useMemo(() => {
        if (data) {
            const address = '/' + (data.episodeName ? 'show' : 'movie') + '=' + data.name.replace(/\s/g, '+');
            return {as: address, href: '/info?mediaId=' + data.mediaId}
        } else return null;
    }, [data]);

    if (data && response && asPath)
        return (
            <>
                <img src={data.backdrop} className={cd.pf} alt={data.episodeName || data.name}/>
                <div className={cd.upHldr}/>
                <div className={cd.hldr}>
                    <BackButton response={response}/>
                    {data.logo ?
                        <img className={cd.lgo} src={data.logo} alt={data.episodeName || data.name}/> :
                        <div className={cd.nm}>{data.name}</div>
                    }
                    <div className={cd.epi}>Up next: {data.episodeName || data.name}</div>
                    <p>{data.overview}</p>
                    <div className={cd.but}>
                        <FramesButton type='primary' label={`plays in: ${diff}`} icon='play'
                                      link={{href: data.location}}/>
                        <FramesButton type='secondary' label='see details' icon='info' link={asPath}/>
                    </div>
                </div>
            </>
        )

    else return null;
})

export const AlreadyStreaming = memo(() => {
    const {signOutEveryWhere} = useNotifications();
    const data = useRecoilValue(AlreadyStreamingAtom);

    if (data)
        return (
            <>
                <img src={data.backdrop} className={cd.pf} alt={data.episodeName || data.name}/>
                <div className={cd.upHldr}/>
                <div className={cd.hldr}>
                    <Link href={'/'}>
                        <svg className={styles.bb} viewBox="0 0 512 512">
                            <path d="M256,0C114.844,0,0,114.844,0,256s114.844,256,256,256s256-114.844,256-256S397.156,0,256,0z M256,490.667
				                C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667
				                z"/>
                            <path d="M394.667,245.333H143.083l77.792-77.792c4.167-4.167,4.167-10.917,0-15.083c-4.167-4.167-10.917-4.167-15.083,0l-96,96
				                c-4.167,4.167-4.167,10.917,0,15.083l96,96c2.083,2.083,4.813,3.125,7.542,3.125c2.729,0,5.458-1.042,7.542-3.125
				                c4.167-4.167,4.167-10.917,0-15.083l-77.792-77.792h251.583c5.896,0,10.667-4.771,10.667-10.667S400.563,245.333,394.667,245.333
				                z"/>
                        </svg>
                    </Link>
                    {data.logo ?
                        <img className={cd.lgo} src={data.logo} alt={data.episodeName || data.name}/> :
                        <div className={cd.nm}>{data.name}</div>
                    }
                    <div className={cd.epi}>Currently watching: {data.episodeName || data.name}</div>
                    <p>Someone is currently streaming {data.episodeName || data.name} on another device. To continue
                        streaming your favorite media, consider creating a new account, it is free!</p>
                    <div className={cd.but}>
                        <FramesButton type='primary' tooltip={'return home'} link={{href: '/'}}/>
                        <FramesButton type='secondary' icon={'info'} tooltip={'sign out everywhere'}
                                      onClick={signOutEveryWhere}/>
                    </div>
                </div>
            </>
        )

    else return null;
})

export const Subtitles = memo(() => {
    const [within, setWithin] = useState(false);
    const response = useRecoilValue(framesVideoStateAtom);
    const activeSub = useRecoilValue(framesSubtitlesAtom).activeSub;
    const sub = useRecoilValue(SubtitlesAndUpNextAtom).subtitles;
    const {switchLanguage} = useRightControls();

    return (
        <div onClick={(event) => event.stopPropagation()}
             onMouseEnter={() => setWithin(true)} onMouseLeave={() => setWithin(false)} className={ss.subH}
             style={sub || within ? {opacity: 1} : {visibility: "hidden"}}>
            <div className={`${ss.subE} ${activeSub === 'none' ? ss.ctv : ''}`}
                 onClick={() => switchLanguage('none')}>None
            </div>
            {response && response.subs ? response.subs.map((e, v) =>
                <Sub sub={e} key={v}/>
            ) : null}
        </div>
    )
})

const Sub = memo(({sub}: { sub: { language: string, url: string } }) => {
    const activeSub = useRecoilValue(framesSubtitlesAtom).activeSub;
    const {switchLanguage} = useRightControls();

    if (sub && sub.url !== '')
        return (
            <>
                <div className={ss.subD}/>
                <div className={`${ss.subE} ${activeSub === sub.language ? ss.ctv : ''}`}
                     onClick={() => switchLanguage(sub.language)}>{sub.language}</div>
            </>
        )

    else return null;
})

export const UpNextMini = memo(() => {
    const upNext = useRecoilValue(UpNextAtom);
    const next = useRecoilValue(SubtitlesAndUpNextAtom).upNext;
    const {playNext} = useRightControls();

    if (upNext)
        return (
            <div className={ss.un} style={next ? {opacity: "1"} : {visibility: "hidden"}} onClick={playNext}>
                <Media data={{...upNext, id: upNext.mediaId, type: 'SHOW'}} media={true}/>
                <div className={ss.p}><p>{upNext.overview}</p></div>
            </div>
        )

    else return null;
})

export const SubDisplay = memo(() => {
    const sub = useRecoilValue(SubtitlesAtom);

    if (sub)
        return (
            <div className={cd.subs}
                 style={sub.move ? {bottom: '20vh'} : {}}>
                <div style={sub.style}>{sub.display}</div>
            </div>
        )

    else return null;
})
