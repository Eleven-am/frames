import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import ss from './MISC.module.css';
import sss from '../settings/ACCOUNT.module.css';
import useModify, {DeleteAndLocationAtom, EditFrontMediaAtom, EditModalAtom} from "../../../utils/modify";
import {memo, useCallback, useEffect, useState} from "react";
import {MediaType} from "@prisma/client";
import {subscribe, useEventListener, useFetcher} from "../../../utils/customHooks";
import {FrontImages} from "../../../../server/classes/tmdb";
import {FramesButton} from "../buttons/Buttons";
import {EpisodeModSettings, FrontEpisode, FrontMediaSearch} from "../../../../server/classes/media";
import {useConfirmDispatch} from "../../../utils/notifications";

const General = memo(() => {
    const setDelete = useSetRecoilState(DeleteAndLocationAtom);
    const {getMediaInfo} = useModify();
    const [state, dispatch] = useRecoilState(EditFrontMediaAtom);
    const [tmdbI, setTmdbI] = useState('');
    const [search, setSearch] = useState('');
    const dispatcher = useConfirmDispatch();
    const {
        response,
        abort
    } = useFetcher<FrontMediaSearch[]>(`/api/modify/searchMedia?mediaType=${state.type}&query=${search}`);

    const handleTmdbIChange = useCallback(async (tmdbI: string) => {
        if (isNaN(parseInt(tmdbI)))
            return;

        else {
            const {media: res, check} = await getMediaInfo(+tmdbI, state.type!);
            if (res) {
                const year = new Date(res.release_date || res.first_air_date).getFullYear();
                const name = res.title || res.name || '';
                const tmdbId = res.id;
                dispatch(prev => ({...prev, name, year, tmdbId}))
            }

            setDelete({location: check?.location || null, del: !!check, name: check?.name || ''})
        }
    }, [getMediaInfo, state.type, dispatch]);

    useEffect(() => {
        if (search === '')
            abort.cancel();
    }, [search]);

    subscribe(handleTmdbIChange, tmdbI);

    return (
        <div className={ss.genInput}>
            <label>fileName</label>
            <br/>
            <input type="text" disabled={true} value={state.file?.name || ''}/>
            <br/>
            <label>Media Name: {state.name}</label>
            <br/>
            <input type="text" onChange={e => setSearch(e.currentTarget.value)} defaultValue={state.name}/>
            <br/>
            <label>The Movie Database ID: {state.tmdbId}</label>
            <input type="text" onChange={e => setTmdbI(e.currentTarget.value)} defaultValue={state.tmdbId}/>
            <ul className={ss.list}>
                {response?.map((e, v) => <li key={v} onClick={() => {
                    if (e.inLibrary) {
                        dispatcher({
                            type: 'error',
                            heading: 'Media already in library',
                            message: `This media is in your library with name: ${e.libraryName}, you can replace it with this one.`
                        })

                        setDelete({del: true, location: e.libraryLocation, name: e.libraryName!})
                    }
                    dispatch(prev => ({...prev, tmdbId: e.tmdbId, name: e.name, year: e.year}))
                }
                }>name: {e.name} date: {e.year}</li>)}
            </ul>
        </div>
    )
})

const Images = memo(() => {
    const [state, dispatch] = useRecoilState(EditFrontMediaAtom);
    const {response} = useFetcher<FrontImages>(`/api/modify/getImages/${state.type}?tmdbId=${state.tmdbId}&name=${state.name}&year=${state.year}`);

    if (response)
        return (
            <div className={ss.genInput}>
                <label>Poster</label>
                <div className={ss.images}>
                    {response.posters.map(e => <img title={e.name + ': ' + e.source} alt={e.name} src={e.url}
                                                    key={e.url}
                                                    onClick={() => dispatch(prev => ({...prev, poster: e.url}))}/>)}
                </div>
                <input type="text" onChange={e => dispatch(prev => ({...prev, poster: e.currentTarget.value}))}
                       value={state.poster}/>
                <label>Backdrop</label>
                <div className={ss.images}>
                    {response.backdrops.map(e => <img title={e.name + ': ' + e.source} alt={e.name} src={e.url}
                                                      key={e.url}
                                                      onClick={() => dispatch(prev => ({...prev, backdrop: e.url}))}/>)}
                </div>
                <input type="text" onChange={e => dispatch(prev => ({...prev, backdrop: e.currentTarget.value}))}
                       value={state.backdrop}/>
                <label>Logo</label>
                <div className={ss.images}>
                    {response.logos.map(e => <img title={e.name + ': ' + e.source} alt={e.name} src={e.url} key={e.url}
                                                  onClick={() => dispatch(prev => ({...prev, logo: e.url}))}/>)}
                </div>
                <input type="text" onChange={e => dispatch(prev => ({...prev, logo: e.currentTarget.value}))}
                       value={state.logo || ''}/>
                {state.poster !== '' || state.backdrop !== '' || state.logo !== '' ? <>
                    <label>Selected</label>
                    <div className={ss.images}>
                        <img title={'poster'} src={state.poster} alt={'selected'}/>
                        <img title={'backdrop'} src={state.backdrop} alt={'selected'}/>
                        <img title={'logo'} src={state.logo || ''} alt={'selected'}/>
                    </div>
                </> : null}
            </div>
        )

    else return null;
})

const Tail = memo(({close}: { close: () => void }) => {
    const found = useRecoilValue(DeleteAndLocationAtom);
    const state = useRecoilValue(EditFrontMediaAtom).stateType;
    const {modifyMedia, deleteMedia, scanSubs} = useModify();

    return (
        <div className={ss.tail}>
            {found.del ? <FramesButton type='primary' label='delete this' state={close} onClick={deleteMedia}/> : null}
            {state === 'MODIFY' ?
                <FramesButton type='secondary' label={'scan subs'} onClick={scanSubs}/> : null}
            <FramesButton type='secondary' label={found.del ? 'replace' : 'submit'} state={close} onClick={modifyMedia}/>
        </div>
    )
})

export const Episodes = memo(() => {
    const [thoroughHover, setThoroughHover] = useState(false);
    const [quickHover, setQuickHover] = useState(false);
    const state = useRecoilValue(EditFrontMediaAtom);
    const {response} = useFetcher<FrontEpisode | null>(`/api/modify/getEpisodes?mediaId=${state.mediaId}`);
    const {scanMedia} = useModify();

    return (
        <div className={ss.epiHolder}>
            <div className={ss.buttons}>
                <FramesButton type='primary' onClick={scanMedia} state={true} icon='scan' label='thorough scan' onHover={setThoroughHover}/>
                <FramesButton type='secondary' onClick={scanMedia} state={false} icon='scan' label='quick scan' onHover={setQuickHover}/>
            </div>
            {thoroughHover || quickHover ?
                <div
                    className={ss.info}>{thoroughHover ? 'Only use thorough hover when you have episodes files you wish to replace. The thorough scan takes much longer to complete' : `Ideal for scanning new files you have added to the present show. It's quick and doesn't attempt to fix episodes that has already been scanned`}</div> : null}

            {state.stateType === 'ADD' && <div>To see episodes you need to add this show to your media database</div>}
            {(response?.seasons || []).map(e => <Season key={e.seasonId} {...e}/>)}
        </div>
    )
})

const Season = memo(({
                    seasonId,
                    episodes
                }: { seasonId: number; episodes: (EpisodeModSettings & { backdrop: string, name: string, overview: string, found: boolean })[] }) => {

    return (
        <div style={{marginTop: '10px'}}>
            <span>Season {seasonId}</span>

            {episodes.map((episode, v) => <Episode episode={episode} key={v}/>)}
        </div>
    )
})

const Episode = memo(({episode: obj}: { episode: (EpisodeModSettings & { backdrop: string, name: string, overview: string, found: boolean }) }) => {
    const [episode, setEpisode] = useState<EpisodeModSettings>(obj);
    const [hover, setHover] = useState(false);
    const {modifyEpisode} = useModify();

    return (
        <div className={sss.res} style={!obj.found ? {color: 'rgba(245, 78, 78, .9)'} : {}}
             onClick={() => setHover(true)}
             onMouseLeave={() => setHover(false)}>
            {!hover ? <>
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
                        <span>{obj.file?.name}</span>
                        <div className={ss.epi}>
                            <label className={ss.label}>
                                Season number
                                <input type="number"
                                       onChange={e => setEpisode({...episode, seasonId: +(e.target.value)})}
                                       value={episode.seasonId}/>
                            </label>

                            <label className={ss.label}>
                                Episode number
                                <input type="number"
                                       onChange={e => setEpisode({...episode, episode: +(e.target.value)})}
                                       value={episode.episode}/>
                            </label>
                        </div>
                        <div className={ss.epiSub}>
                            <FramesButton type='secondary' label='submit' state={episode} onClick={modifyEpisode}/>
                        </div>
                    </div>
                </div>
            }

        </div>
    )
}
)
export const ManageMedia = memo(() => {
    const setDelete = useSetRecoilState(DeleteAndLocationAtom);
    const [state, setState] = useRecoilState(EditFrontMediaAtom);
    const [modal, setModal] = useRecoilState(EditModalAtom);
    const [select, setSelect] = useState('');
    const [sides, setSides] = useState<string[]>([]);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape')
            setDelete({del: true, location: state.location, name: state.name});
    })

    useEffect(() => {
        setSides(['General', 'Images'].concat((state.type === MediaType.MOVIE ? [] : ['Episodes'])));
        setSelect('General');
        setModal(state.stateType !== 'NONE');
    }, [state.stateType]);

    const close = useCallback(() => {
        setModal(false);
        setTimeout(() => {
            setState(prev => ({...prev, stateType: 'NONE'}));
            setDelete({del: false, location: '', name: ''});
        }, 200)
    }, [])

    if (state.stateType !== 'NONE')
        return (
            <>
                <div className={`${ss.block} ${modal ? ss.o : ss.c}`} onClick={close}>
                    <div className={ss.container} onClick={e => e.stopPropagation()}>
                        <img className={ss.bckImg} src={state.backdrop || ''} alt={state.name}/>
                        <div className={ss.hold}>
                            <div className={ss.head}>
                                <div>{(state.stateType === 'MODIFY' ? 'Modify ' : 'Add')} {(state.name || '')}</div>
                            </div>

                            <div className={ss.body}>
                                <ul className={ss.side}>
                                    {sides.map((e, v) => <li key={v} className={e === select ? ss.sel : ss.nSel}
                                                             onClick={() => setSelect(e)}>{e}</li>)}
                                </ul>

                                <div>
                                    {select === 'General' ? <General/> : select === 'Images' ?
                                        <Images/> : <Episodes/>}
                                </div>
                            </div>

                            <Tail close={close}/>
                        </div>
                    </div>
                </div>
            </>
        )

    else return null;
})
