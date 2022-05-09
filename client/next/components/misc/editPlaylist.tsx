import {FramePlaylistVideo, FramesPlaylist} from "../../../../server/classes/listEditors";
import ss from "./MISC.module.css";
import {useFetcher} from "../../../utils/customHooks";
import {useEffect, useState} from "react";
import {atom, selector, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {Generator} from "@prisma/client";
import {UpdateSearch} from "../../../../server/classes/modify";
import {useBase} from "../../../utils/Providers";
import sss from "../settings/ACCOUNT.module.css";
import {Template} from "../buttons/Buttons";
import {useConfirmDispatch, useInfoDispatch} from "./inform";

const PlaylistSides = atom<string[]>({
    key: "PlaylistSides",
    default: []
});

const identifierAtom = atom<string | null>({
    key: "identifierAtom",
    default: null
});

const PlaylistAtom = atom<Omit<FramesPlaylist, 'location'>>({
    key: 'playlist',
    default: {
        name: '',
        identifier: '',
        isPublic: false,
        generator: Generator.USER,
        overview: '',
        backdrop: '',
        logo: '',
        videos: [],
        timestamp: ''
    }
});

const PlaylistAtomState = atom<string>({
    key: 'playlistAtomState',
    default: ''
});

const PlaylistNameSAtom = atom<string>({
    key: 'playlistNameSAtom',
    default: ''
});

const PlaylistVideoAtom = atom<FramePlaylistVideo[]>({
    key: 'PlaylistVideoAtom',
    default: []
});

const playlistVideoSelector = selector({
    key: 'playlistVideoSelector',
    get: ({get}) => {
        const playlist = get(PlaylistAtom);
        const videos = get(PlaylistVideoAtom);
        return playlist.videos.concat(videos);
    }
});

export default function usePlaylist() {
    const base = useBase();
    const dispatch = useInfoDispatch();
    const [state, setState] = useRecoilState(PlaylistAtom);
    const setSides = useSetRecoilState(PlaylistSides);
    const setIdentifier = useSetRecoilState(identifierAtom);
    const [vid, setVideo] = useRecoilState(PlaylistVideoAtom);
    const setSideState = useSetRecoilState(PlaylistAtomState);
    const [name, setName] = useRecoilState(PlaylistNameSAtom);

    const close = () => {
        setIdentifier(null);
        setTimeout(() => {
            setState({
                name: '',
                identifier: '',
                isPublic: false,
                generator: Generator.USER,
                overview: '',
                backdrop: '',
                logo: '',
                videos: [],
                timestamp: ''
            });
            setName('');
            setVideo([]);
        }, 300);
    }

    const openPlaylist = async (id: number) => {
        const data = await base.makeRequest<{data: FramePlaylistVideo[], name: string}>(`/api/settings/getVideosForMedia`, {mediaId: id}, 'GET');
        setVideo(data?.data || []);
        setName(data?.name || '');
        pushPlaylist(['playlists', 'overview', 'videos'], null);
    }

    const addVideoToPlaylist = async (videoId: number) => {
        const data = await base.makeRequest<{data: FramePlaylistVideo, name: string}>(`/api/settings/getVideoForPlaylist`, {videoId}, 'GET');
        if (data) {
            setVideo([...vid, data.data]);
            setName(data.name);
            pushPlaylist(['playlists', 'overview', 'videos'], null);
        }
    }

    const pushPlaylist = (sides: string[], identifier: string | null) => {
        setSides(sides);
        setSideState(sides[0]);
        identifier = identifier || base.generateKey(7, 5);
        setIdentifier(identifier);
    }

    const getPlaylists = async (set: (a: FramesPlaylist[]) => void) => {
        const data = await base.makeRequest<FramesPlaylist[]>('/api/settings/getPlaylists', null);
        if (data) set(data);
        else set([]);
    }

    const getVideoForMedia = async (id: number, set: (a: UpdateSearch[]) => void, set2: (a: string) => void) => {
        const data = await base.makeRequest<{name: string, data: FramePlaylistVideo[]}>(`/api/settings/getVideosForMedia`, {mediaId: id}, 'GET');
        if (data) {
            set([]);
            set2('');
            setVideo([...vid, ...data.data]);
            setName(data.name);
        }
    }

    const removeVideo = (id: number) => {
        setState(p => {
            return {
                ...p,
                videos: p.videos.filter(v => v.id !== id)
            }
        });
    }

    const loadPlaylist = async (identifier: string) => {
        let data = await base.makeRequest<FramesPlaylist>(`/api/settings/getPlaylist`, { identifier }, 'GET');
        if (data) {
            data.name = data.name === '' && name !== '' ? `${name}: Playlist` : data.name;
            setState(data);
            vid.length === 0 && setSideState('overview');
        }
    }

    const saveToPlaylist = async (identifier: string) => {
        const params = {
            identifier,
            videos: vid.map(e => e.id)
        }
        const data = await base.makeRequest<boolean>('/api/modify/addToPlaylist', params, 'POST');
        close();
        dispatch({
            type: data ? 'alert' : 'error',
            heading: data ? 'Playlist saved' : 'Error saving playlist',
            message: data ? 'Playlist saved successfully' : 'There was an error saving the playlist'
        });
    }

    const submit = async () => {
        if (state.name !== '' && state.identifier !== '' && (state.videos.length > 0 || vid.length > 0) && state.overview !== '') {
            const params = {
                name: state.name,
                identifier: state.identifier,
                isPublic: state.isPublic,
                generator: state.generator,
                overview: state.overview,
                backdrop: state.backdrop,
                logo: state.logo,
                videos: state.videos.map(e => e.id).concat(vid.map(e => e.id)),
                timestamp: state.timestamp
            }

            const data = await base.makeRequest<boolean>('/api/modify/createPlaylist', params, 'POST');
            close();
            dispatch({
                type: data ? 'alert' : 'error',
                heading: data ? 'Playlist saved' : 'Error saving playlist',
                message: data ? 'Playlist saved successfully' : 'There was an error saving the playlist'
            });
        } else {
            dispatch({
                type: 'error',
                heading: 'Error saving playlist',
                message: 'There was an error saving the playlist, consider adding a name, description, and some videos'
            });
        }
    }

    const deletePlaylist = async () => {
        const data = await base.makeRequest<boolean>('/api/modify/deletePlaylist', { identifier: state.identifier }, 'GET');
        close();
        dispatch({
            type: data ? 'alert' : 'error',
            heading: data ? 'Playlist deleted' : 'Error deleting playlist',
            message: data ? 'Playlist deleted successfully' : 'There was an error deleting the playlist'
        });
    }

    return {addVideoToPlaylist, close, deletePlaylist, saveToPlaylist, loadPlaylist, pushPlaylist, getVideoForMedia, removeVideo, getPlaylists, openPlaylist, submit, setSideState}
}

export const ManagePlaylist = () => {
    const sides = useRecoilValue(PlaylistSides);
    const identifier = useRecoilValue(identifierAtom);
    const response = useRecoilValue(PlaylistAtom);
    const [select, setSelect] = useRecoilState(PlaylistAtomState);
    const {loadPlaylist, close} = usePlaylist();

    useEffect(() => {
        identifier && loadPlaylist(identifier);
    }, [identifier])

    if (response && response.identifier === identifier)
        return (
            <div className={`${ss.block} ${identifier ? ss.o : ss.c}`} onClick={close}>
                <div className={ss.container} onClick={e => e.stopPropagation()}>
                    <img className={ss.bckImg} src={response.backdrop} alt={response.name}/>
                    <div className={ss.hold}>
                        <div className={ss.head}>
                            <div>{response.name}</div>
                        </div>
                        <div className={ss.body}>
                            <ul className={ss.side}>
                                {sides.map(e => <li key={e} className={e === select ? ss.sel : ss.nSel}
                                                    onClick={() => setSelect(e)}>{e}</li>)}
                            </ul>
                            <div>
                                {select === 'overview' && <Overview/>}
                                {select === 'videos' && <Videos/>}
                                {select === 'playlists' && <Playlists/>}
                            </div>
                        </div>
                        <Tail/>
                    </div>
                </div>
            </div>
        )

    return null;
}

const Overview = () => {
    const [state, setState] = useRecoilState(PlaylistAtom);
    return(
        <div className={ss.genInput}>
            <label>identifier</label>
            <br/>
            <input type="text" disabled={true} value={state.identifier}/>
            <br/>
            <label>name</label>
            <br/>
            <input type="text" value={state.name} onChange={e => setState(prev => ({...prev, name: e.currentTarget.value}))}/>
            <br/>
            <label>description</label>
            <br/>
            <textarea value={state.overview || ''} onChange={e => setState(prev => ({...prev, overview: e.currentTarget.value}))}/>
            <br/>
            <div className={ss.dc} onClick={() => setState(prev => ({...prev, isPublic: !prev.isPublic}))}>
                <label style={{cursor: 'pointer'}}>make playlist public</label>
                <input type="checkbox" readOnly={true} checked={state.isPublic} style={{width: '20%'}}/>
            </div>
        </div>
    )
}

const Videos = () => {
    const confirmAction = useConfirmDispatch();
    const {getVideoForMedia, removeVideo} = usePlaylist();
    const [media, setMedia] = useState('');
    const state = useRecoilValue(playlistVideoSelector);
    const [response, setResponse] = useState<UpdateSearch[]>([]);
    const {abort} = useFetcher<UpdateSearch[]>(`/api/settings/libSearch?value=${media}`, {
        onSuccess: (data) => {
            setResponse(data);
        }
    });

    useEffect(() => {
        if (media === '')
            abort.cancel();
    }, [media]);

    const handleSearchClick = (id: number) => getVideoForMedia(id, setResponse, setMedia);

    const handleVideoClick = (id: number) => {
        confirmAction({
            type: 'client',
            heading: 'Remove video from playlist',
            message: 'Are you sure you want to remove this video from the playlist?',
            confirmText: 'Remove',
            cancelText: 'Cancel',
            confirm: true,
            onOk: () => removeVideo(id),
            onCancel: () => {}
        })
    }

    return (
        <div className={ss.genInput}>
            <label>search for media</label>
            <input type='text' value={media} onChange={e => setMedia(e.currentTarget.value)}/>
            {response.length !== 0 && <div className={ss.pickGrid} style={{gridTemplateColumns: '1fr 1fr'}}>
                {response.map(e => <VideoResponse {...e} option={'search'} onClick={handleSearchClick} key={e.id}/>)}
            </div>}
            {response.length === 0 && <div className={ss.epiHolder}>
                {state.map(e => <VideoResponse {...e} option={'video'} onClick={handleVideoClick} key={e.id}/>)}
            </div>}
        </div>
    )
}

const Playlists = () => {
    const [state, setState] = useState<FramesPlaylist[]>([]);
    const {getPlaylists, setSideState, saveToPlaylist} = usePlaylist();

    useEffect(() => {
        getPlaylists(setState);
    }, []);

    return (
        <div className={ss.genInput}>
            <div className={ss.pBtn}>
                <Template id={1} type={'add'} name={`create new playlist`} onClick={() => setSideState('overview')}/>
            </div>
            <div className={ss.epiHolder}>
                {state.map(e => <VideoResponse {...e} option={'video'} id={e.identifier} onClick={saveToPlaylist} key={e.identifier}/>)}
            </div>
        </div>
    )
}

const Tail = () => {
    const state = useRecoilValue(PlaylistAtom);
    const {deletePlaylist, submit} = usePlaylist();

    return (
        <div className={ss.tail}>
            {state.videos.length ? <Template id={1} type={'none'} name={'delete this'} onClick={deletePlaylist}/> : null}
            <Template id={1} type={'none'} name={state.videos.length ? 'modify' : 'submit'} onClick={submit}/>
        </div>
    )
}

interface VideoResponseProps<S> {
    onClick: (data: S) => void;
    id: S;
    backdrop: string;
    name: string;
    logo: string | null;
    overview?: string | null;
    option: 'search' | 'video';
}

function VideoResponse(obj: VideoResponseProps<any>) {
    if (obj.option === 'search')
        return (
            <div onClick={() => obj.onClick(obj.id)} className={ss.pickImgHolder}>
                <img className={ss.img1} src={obj.backdrop} alt={obj.name}/>
                <img className={ss.img2} src={obj.logo || ''} alt={obj.name}/>
            </div>
        )

    else
        return (
            <div className={sss.res} onClick={() => obj.onClick(obj.id)}>
                <img src={obj.backdrop} style={{marginRight: '10px'}} alt={obj.name} className={sss.resImage}/>
                <div className={sss.resDiv}>
                    <div className={sss.resSpan}>
                        <span>{obj.name}</span>
                    </div>
                    <p>{obj.overview}</p>
                </div>
            </div>
        )
}