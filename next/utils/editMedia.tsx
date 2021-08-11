import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {EditMedia} from "../../server/classes/media";
import {FramesImages, UpdateInterface, UpdateMediaSearch} from "../../server/classes/update";
import {MediaType} from '@prisma/client';
import {useEffect, useState} from "react";
import {drive_v3} from "googleapis";
import {InformDisplayContext} from "../components/misc/inform";
import { pFetch } from "./baseFunctions";
import {Template} from "../components/buttons/Buttons";
import ss from '../components/misc/MISC.module.css';
import {useFetcher} from "./customHooks";

export const EditMediaContext = atom<EditMedia|null>({
    key: 'EditMediaContext',
    default: null
})

const TmdbAtom = atom({
    key: 'TmdbAtom',
    default: -1
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

const UpdateSelector = selector<{data: UpdateInterface, location: string}>({
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

    return () => {
        type();
        tmdb();
        location();
        logo();
        backdrop();
        name();
        poster();
    }
}

function General({state}: { state: EditMedia }) {
    const [file, setFile] = useState<drive_v3.Schema$File | null>(null);
    const [tmdb, setTmdb] = useRecoilState(TmdbAtom);
    const [tmdbI, setTmdbI] = useState('');
    const [type, setType] = useRecoilState(TypeAtom);
    const [name, setName] = useRecoilState(NameAtom);
    const setLocation = useSetRecoilState(LocationAtom);
    const [search, setSearch] = useState('');
    const setInform = useSetRecoilState(InformDisplayContext);
    const {response, abort: resAbort} = useFetcher<UpdateMediaSearch[]>('/api/update/mediaSearch?value=' + search + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));
    const {response: data, abort: dataAbort} = useFetcher<{ file: string, found: boolean } | false>('/api/update/getMedia?value=' + tmdbI + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));

    const getFile = async (ac: AbortController) => {
        if (state.media) {
            const res = await fetch('/api/update/getMediaFile?id=' + state.media.id, {signal: ac.signal});
            const data: { file: drive_v3.Schema$File | null, tmdbId: number } | null = await res.json();
            if (data){
                data.file && setFile(data.file);
                setTmdb(data.tmdbId);
                setName(state.media.name);
                setType(state.media.type)
            }
        } else if (state.unScan) {
            setFile(state.unScan.file);
            setType(state.unScan.type)
            if (state.unScan.res.length === 1) {
                setTmdb(state.unScan.res[0].tmdbId);
                setName(state.unScan.res[0].name)
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
        if (data && !data.found) {
            setTmdb(+(tmdbI));
            setName(data.file);
        } else if (data && data.found)
            setInform({
                type: "error",
                heading: 'Existing Media',
                message: data.file + ' already exists consider deleting this duplicate'
            })
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
    const {response, abort} = useFetcher<FramesImages>('/api/update/findImages?value=' + tmdb + '&lib=' + (type === 'MOVIE' ? 'movie' : 'show'));

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
                    {response.posters.map(e =>  <img title={e.name} src={e.url} onClick={() => setPoster(e.url)} alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setPoster(e.currentTarget.value)} defaultValue={poster}/>
                <label>Backdrop</label>
                <div className={ss.images}>
                    {response.backdrops.map(e => <img title={e.name} src={e.url} onClick={() => setBackdrop(e.url)} alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setBackdrop(e.currentTarget.value)} defaultValue={backdrop}/>
                <label>Logo</label>
                <div className={ss.images}>
                    {response.logos.map(e => <img title={e.name} src={e.url} onClick={() => setLogo(e.url)} alt={e.name}/>)}
                </div>
                <input type="text" onChange={e => setLogo(e.currentTarget.value)} defaultValue={logo}/>
                {poster !== '' || backdrop !== '' || logo !== '' ?<>
                    <label>Selected</label>
                    <div className={ss.images}>
                        <img title={'poster'} src={poster} alt={'selected'}/>
                        <img title={'backdrop'} src={backdrop} alt={'selected'}/>
                        <img title={'logo'} src={logo} alt={'selected'}/>
                    </div>
                </>: null}
            </div>
        )

    else return null;
}

function Tail({state}: { state: EditMedia }) {
    const update = useRecoilValue(UpdateSelector);
    const setInform = useSetRecoilState(InformDisplayContext);

    const attemptUpload = async () => {
        if (update.data.tmdbId !== -1 && update.data.poster !== '' && update.data.backdrop !== '' && update.data.name !== '' && update.location !== '') {
            let file = await pFetch(update, '/api/update/modify');
            if (file)
                setInform({
                    type: "alert",
                    heading: 'Media ' + (state.media ? 'updated': 'added'),
                    message: update.data.name + ' has been successfully ' + (state.media ? 'updated': 'added to your library')
                })

        } else setInform({
            type: "error",
            heading: 'Missing parameters',
            message: 'Some required parameters like TMDB ID, poster or backdrop are missing'
        })
    }

    return (
        <div className={ss.tail}>
            <Template id={1} type={'none'} name={'submit'} onClick={attemptUpload}/>
        </div>
    )
}

export const ManageMedia = () => {
    const [state, dispatch] = useRecoilState(EditMediaContext);
    const [open, setOpen] = useState(true);
    const [select, setSelect] = useState('');
    const [sides, setSides] = useState<string[]>([]);
    const setInform = useSetRecoilState(InformDisplayContext);
    const reset = useReset();

    let list: string[] = [];

    useEffect(() => {
        if (select === 'Episodes')
            setInform({
                type: 'error',
                heading: 'Feature not available',
                message: 'Editing of episodes is currently not supported'
            })
    }, [select])

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

    if (state)
        return (
            <>
                <div className={`${ss.block} ${open ? ss.o : ss.c}`} onClick={() => {
                    setOpen(false)
                    setTimeout(() => {
                        setOpen(true);
                        dispatch(null);
                        reset();
                    }, 200)
                }}>
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
                                        select === 'Images' ? <Images state={state}/> : null
                                    }
                                </div>
                            </div>

                            <Tail state={state}/>
                        </div>
                    </div>
                </div>
            </>
        )

    else return null;
}