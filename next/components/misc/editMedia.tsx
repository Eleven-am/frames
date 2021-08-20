import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {EditMedia} from "../../../server/classes/media";
import {FramesImages, UpdateInterface, UpdateMediaSearch} from "../../../server/classes/update";
import {MediaType} from '@prisma/client';
import React, {useCallback, useEffect, useState} from "react";
import {drive_v3} from "googleapis";
import {InformDisplayContext} from "./inform";
import {pFetch} from "../../utils/baseFunctions";
import {Template} from "../buttons/Buttons";
import ss from './MISC.module.css';
import sss from '../settings/ACCOUNT.module.css';
import {useFetcher} from "../../utils/customHooks";
import {EditEpisode, EditEpisodes} from "../../../server/classes/episode";

export const EditMediaContext = atom<EditMedia | null>({
    key: 'EditMediaContext',
    default: null
})

const TmdbAtom = atom({
    key: 'TmdbAtom',
    default: -1
})

const FoundAtom = atom({
    key: 'FoundAtom',
    default: false
})

const LogoAtom = atom({
    key: 'LogoAtom',
    default: ''
})

const BackdropAtom = atom({
    key: 'BackdropAtom',
    default: ''
})

const NameAtom = atom({
    key: 'NameAtom',
    default: ''
})

const PosterAtom = atom({
    key: 'PosterAtom',
    default: ''
})

const LocationAtom = atom({
    key: 'LocationAtom',
    default: ''
})

const TypeAtom = atom<MediaType>({
    key: 'TypeAtom',
    default: 'MOVIE'
})

const UpdateSelector = selector<{ data: UpdateInterface, location: string }>({
    key: 'UpdateSelector',
    get: ({get}) => {
        return {
            data: {
                name: get(NameAtom),
                type: get(TypeAtom),
                tmdbId: get(TmdbAtom),
                poster: get(PosterAtom),
                logo: get(LogoAtom),
                backdrop: get(BackdropAtom)
            },
            location: get(LocationAtom)
        }
    }
})

const useReset = () => {
    const tmdb = useResetRecoilState(TmdbAtom);
    const logo = useResetRecoilState(LogoAtom);
    const backdrop = useResetRecoilState(BackdropAtom);
    const name = useResetRecoilState(NameAtom);
    const poster = useResetRecoilState(PosterAtom);
    const type = useResetRecoilState(TypeAtom);
    const location = useResetRecoilState(LocationAtom);
    const found = useResetRecoilState(FoundAtom);

    return () => {
        type();
        tmdb();
        location();
        logo();
        backdrop();
        name();
        poster();
        found();
    }
}

function General({state}: { state: EditMedia }) {
    const [file, setFile] = useState<drive_v3.Schema$File | null>(null);
    const [tmdb, setTmdb] = useRecoilState(TmdbAtom);
    const [tmdbI, setTmdbI] = useState('');
    const [type, setType] = useRecoilState(TypeAtom);
    const [name, setName] = useRecoilState(NameAtom);
    const setLocation = useSetRecoilState(LocationAtom);
    const setFound = useSetRecoilState(FoundAtom);
    const [search, setSearch] = useState('');
    const setInform = useSetRecoilState(InformDisplayContext);
    const {
        response,
        abort: resAbort
    } = useFetcher<UpdateMediaSearch[]>('/api/update/mediaSearch?value=' + search + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));
    const {
        response: data,
        abort: dataAbort
    } = useFetcher<{ file: string, found: boolean } | false>('/api/update/getMedia?value=' + tmdbI + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));

    const getFile = async (ac: AbortController) => {
        if (state.media) {
            const res = await fetch('/api/update/getMediaFile?id=' + state.media.id, {signal: ac.signal});
            const data: { file: drive_v3.Schema$File | null, tmdbId: number } | null = await res.json();
            if (data) {
                data.file && setFile(data.file);
                setTmdb(data.tmdbId);
                setName(state.media.name);
                setType(state.media.type)
            }
        } else if (state.unScan) {
            setFile(state.unScan.file);
            setType(state.unScan.type)
            if (state.unScan.res.length === 1) {
                setFound(state.unScan.available);
                setTmdb(state.unScan.res[0].tmdbId);
                setName(state.unScan.res[0].name);
            }
        }
    }

    useEffect(() => {
        const ac = new AbortController();
        getFile(ac)
        return () => ac.abort();
    }, [state])

    useEffect(() => {
        if (file)
            setLocation(file.id!);
    }, [file])

    useEffect(() => {
        if (search === '')
            resAbort.cancel();

        return () => resAbort.cancel();
    }, [search])

    useEffect(() => {
        if (isNaN(parseInt(tmdbI)))
            dataAbort.cancel();
        return () => dataAbort.cancel();
    }, [tmdbI])

    useEffect(() => {
        if (data) {
            if (data.found && ((tmdb !== parseInt(tmdbI) && state.media) || state.unScan)) {
                setFound(true);
                setInform({
                    type: "error",
                    heading: 'Existing Media',
                    message: data.file + ' already exists consider deleting this duplicate'
                })
            }

            setTmdb(+(tmdbI));
            setName(data.file);
        }
    }, [data])

    if (file)
        return (
            <div className={ss.genInput}>
                <label>fileName</label>
                <br/>
                <input type="text" disabled={true} value={file.name!}/>
                <br/>
                <label>Media Name: {name}</label>
                <br/>
                <input type="text" onChange={e => setSearch(e.currentTarget.value)} defaultValue={name}/>
                <br/>
                <label>The Movie Database ID: {tmdb}</label>
                <input type="text" onChange={e => setTmdbI(e.currentTarget.value)} defaultValue={tmdb}/>

                <ul className={ss.list}>
                    {response?.map((e, v) => <li key={v} onClick={() => {
                        setName(e.name);
                        setType(e.type);
                        setTmdb(e.id);
                    }
                    }>name: {e.name} date: {e.date}</li>)}
                </ul>
            </div>
        )

    else return null;
}

function Images({state}: { state: EditMedia }) {
    const tmdb = useRecoilValue(TmdbAtom);
    const type = useRecoilValue(TypeAtom);
    const [poster, setPoster] = useRecoilState(PosterAtom);
    const [logo, setLogo] = useRecoilState(LogoAtom);
    const [backdrop, setBackdrop] = useRecoilState(BackdropAtom);
    const {
        response,
        abort
    } = useFetcher<FramesImages>('/api/update/findImages?value=' + tmdb + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));

    useEffect(() => {
        if (state && state.media) {
            setLogo(state.media.logo!);
            setBackdrop(state.media.backdrop!);
            setPoster(state.media.poster!);
        }
        return () => abort.cancel()
    }, [state])

    if (response)
        return (
            <div className={ss.genInput}>
                <label>Poster</label>
                <div className={ss.images}>
                    {response.posters.map(e => <img title={e.name} src={e.url} onClick={() => setPoster(e.url)}
                                                    alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setPoster(e.currentTarget.value)} defaultValue={poster}/>
                <label>Backdrop</label>
                <div className={ss.images}>
                    {response.backdrops.map(e => <img title={e.name} src={e.url} onClick={() => setBackdrop(e.url)}
                                                      alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setBackdrop(e.currentTarget.value)} defaultValue={backdrop}/>
                <label>Logo</label>
                <div className={ss.images}>
                    {response.logos.map(e => <img title={e.name} src={e.url} onClick={() => setLogo(e.url)}
                                                  alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setLogo(e.currentTarget.value)} defaultValue={logo}/>
                {poster !== '' || backdrop !== '' || logo !== '' ? <>
                    <label>Selected</label>
                    <div className={ss.images}>
                        <img title={'poster'} src={poster} alt={'selected'}/>
                        <img title={'backdrop'} src={backdrop} alt={'selected'}/>
                        <img title={'logo'} src={logo} alt={'selected'}/>
                    </div>
                </> : null}
            </div>
        )

    else return null;
}

function Episode({obj}: { obj: EditEpisode }) {
    const [clicked, setClicked] = useState(false);
    const [name, setName] = useState('Not found');
    const [seasonId, setSeason] = useState(obj.seasonId);
    const [episode, setEpisode] = useState(obj.episode);
    const state = useRecoilValue(EditMediaContext);
    const setInform = useSetRecoilState(InformDisplayContext);

    const onClick = async () => {
        if (!clicked) {
            const res = await fetch('/api/update/getEpisodeName?value=' + obj.id);
            const data: { name: string } = await res.json();
            setName(data.name);
            setClicked(true);
        }
    }

    const submit = async () => {
        const data: boolean = await pFetch({
            seasonId,
            episode,
            location: obj.location,
            showId: state?.media?.id
        }, '/api/update/updateEpisode');
        setInform({
            type: data ? "alert" : "warn",
            heading: data ? 'Episode updated' : 'Episode details conflict',
            message: data ? 'The episode has successfully been updated' : 'Another episode with the same season and episode already exists'
        })

        setClicked(false);
    }

    return (
        <div className={sss.res}
             style={!obj.found ? {color: 'rgba(245, 78, 78, .9)'} : {}}
             onMouseLeave={() => setClicked(false)}
             onClick={onClick}>
            {!clicked ?
                <>
                    <img src={obj.backdrop} style={{marginRight: '10px'}} alt={obj.name} className={sss.resImage}/>
                    <div className={sss.resDiv}>
                        <div className={sss.resSpan}>
                            <span>{obj.name}</span>
                        </div>
                        <p>{obj.overview}</p>
                    </div>
                </> :
                <div className={ss.epiOut}>
                    <div>
                        <span>{name}</span>
                        <div className={ss.epi}>
                            <label className={ss.label}>
                                Season number
                                <input type="number" onChange={e => setSeason(+(e.currentTarget.value))}
                                       defaultValue={obj.seasonId}/>
                            </label>

                            <label className={ss.label}>
                                Episode number
                                <input type="number" onChange={e => setEpisode(+(e.currentTarget.value))}
                                       defaultValue={obj.episode}/>
                            </label>
                        </div>
                        <div className={ss.epiSub}>
                            <Template id={1} type={'none'} name={'submit'} onClick={submit}/>
                        </div>
                    </div>
                </div>}
        </div>
    )
}

function Season({season, episodes}: { season: string, episodes: EditEpisode[] }) {

    return (
        <div style={{marginTop: '10px'}}>
            <span>{season}</span>

            {episodes.map((episode, v) => <Episode obj={episode} key={v}/>)}
        </div>
    )
}

function Episodes({state}: { state: EditMedia }) {
    const [thoroughHover, setThoroughHover] = useState(false);
    const [quickHover, setQuickHover] = useState(false);
    const {response} = useFetcher<EditEpisodes[]>('/api/update/getEpisodesForEdit?value=' + state.media?.id);
    const setInform = useSetRecoilState(InformDisplayContext);

    const submit = async (bool: boolean) => {
        if (state.media) {
            await pFetch({thoroughScan: bool, id: state.media?.id}, '/api/update/showScan');
            setInform({
                type: "alert",
                heading: 'Starting library scan',
                message: 'Frames would begin scanning your library shortly'
            })
        } else setInform({
            type: "error",
            heading: 'Invalid action',
            message: `Can't episodes for show as it's not yet been added to Frames`
        })
    }

    return (
        <div className={ss.epiHolder}>
            <div className={ss.buttons}>
                <Template id={0} onClick={() => submit(true)} type={'scan'} name={'thorough scan'}
                          onHover={setThoroughHover}/>
                <Template id={1} onClick={() => submit(false)} type={'scan'} name={'quick scan'}
                          onHover={setQuickHover}/>
            </div>

            {thoroughHover || quickHover ?
                <div
                    className={ss.info}>{thoroughHover ? 'Only use thorough hover when you have episodes files you wish to replace. The thorough scan takes much longer to complete' : `Ideal for scanning new files you have added to the present show. It's quick and doesn't attempt to fix episodes that has already been scanned`}</div> : null}

            {state.unScan && <div>To see episodes you need to add this show to your media database</div>}

            {(response || []).map((e, v) => <Season season={e.season} episodes={e.episodes} key={v}/>)}
        </div>
    )
}

function Tail({state, close}: { state: EditMedia, close: () => void }) {
    const update = useRecoilValue(UpdateSelector);
    const found = useRecoilValue(FoundAtom);
    const setInform = useSetRecoilState(InformDisplayContext);

    const attemptUpload = async () => {
        if (update.data.tmdbId !== -1 && update.data.poster !== '' && update.data.backdrop !== '' && update.data.name !== '' && update.location !== '') {
            let file = await pFetch(update, '/api/update/modify');
            if (file)
                setInform({
                    type: "alert",
                    heading: 'Media ' + (state.media ? 'updated' : 'added'),
                    message: update.data.name + ' has been successfully ' + (state.media ? 'updated' : 'added to your library')
                })

        } else setInform({
            type: "error",
            heading: 'Missing parameters',
            message: 'Some required parameters like TMDB ID, poster or backdrop are missing'
        })
        close();
    }

    const deleteMedia = async () => {
        await pFetch({file: update.location}, '/api/update/delete');
        close();
    }

    return (
        <div className={ss.tail}>
            {found ? <Template id={1} type={'none'} name={'delete this'} onClick={deleteMedia}/> : null}
            <Template id={1} type={'none'} name={found ? 'replace' : 'submit'} onClick={attemptUpload}/>
        </div>
    )
}

export const ManageMedia = () => {
    const [state, dispatch] = useRecoilState(EditMediaContext);
    const [open, setOpen] = useState(true);
    const [select, setSelect] = useState('');
    const [sides, setSides] = useState<string[]>([]);
    const reset = useReset();

    let list: string[] = [];

    useEffect(() => {
        if (state?.media) {
            list = state.media.type === 'MOVIE' ? ['General', 'Images'] : ['General', 'Images', 'Episodes'];
            setSelect(list[0]);
            setSides(list)
        } else if (state?.unScan) {
            list = state.unScan.type === 'MOVIE' ? ['General', 'Images'] : ['General', 'Images', 'Episodes'];
            setSelect(list[0]);
            setSides(list)
        }
    }, [state])

    const close = useCallback(() => {
        setOpen(false)
        setTimeout(() => {
            setOpen(true);
            dispatch(null);
            reset();
        }, 200)
    }, [])

    if (state)
        return (
            <>
                <div className={`${ss.block} ${open ? ss.o : ss.c}`} onClick={close}>
                    <div className={ss.container} onClick={e => e.stopPropagation()}>
                        {state.media || state.unScan?.res.length ?
                            <img className={ss.bckImg}
                                 src={state.media ? state.media.backdrop : state.unScan?.res.length ? state.unScan.res[0].backdrop || '' : ''}
                                 alt={state.media ? state.media.name : state.unScan ? state.unScan.file.name || '' : ''}/> : null}
                        <div className={ss.hold}>
                            <div className={ss.head}>
                                <div>{(state.media ? 'Modify ' : 'Add')} {(state.media?.name || state.unScan?.file.name)}</div>
                            </div>

                            <div className={ss.body}>
                                <ul className={ss.side}>
                                    {sides.map((e, v) => <li key={v} className={e === select ? ss.sel : ss.nSel}
                                                             onClick={() => setSelect(e)}>{e}</li>)}
                                </ul>

                                <div>
                                    {select === 'General' ? <General state={state}/> :
                                        select === 'Images' ? <Images state={state}/> :
                                            <Episodes state={state}/>
                                    }
                                </div>
                            </div>

                            <Tail state={state} close={close}/>
                        </div>
                    </div>
                </div>
            </>
        )

    else return null;
}