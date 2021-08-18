import ss from "../components/misc/MISC.module.css";
import React, {useCallback, useEffect, useState} from "react";
import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {EditPickInterface, PickMedia, PicksList} from "../../server/classes/listEditors";
import style from '../components/settings/ACCOUNT.module.css';
import {PickType} from '@prisma/client';
import {useFetcher} from "./customHooks";
import {UpdateSearch} from "../../server/classes/update";
import {InformDisplayContext} from "../components/misc/inform";
import {pFetch} from "./baseFunctions";
import {Template} from "../components/buttons/Buttons";

const PickMediaAtom = atom<PickMedia[]>({
    key: 'PickMediaAtom',
    default: []
})

const SearchPickAtom = atom<PickMedia[]>({
    key: 'SearchPickAtom',
    default: []
})

const PickGridSelector = selector<PickMedia[]>({
    key: 'PickGridSelector',
    get: ({get}) => {
        const search = get(SearchPickAtom);
        const pick = get(PickMediaAtom);
        return search.length ? search : pick;
    }
})

const PickActiveAtom = atom({
    key: 'PickActiveAtom',
    default: false
})

const PickDisplayAtom = atom({
    key: 'PickDisplayAtom',
    default: ''
})

const PickCategoryAtom = atom({
    key: 'PickCategoryAtom',
    default: ''
})

const PickTypeAtom = atom<PickType>({
    key: 'PickTypeAtom',
    default: PickType.EDITOR
})

const UpdateSelector = selector<PickUpdate>({
    key: 'pickUpdateSelector',
    get: ({get}) => {
        const media = get(PickMediaAtom);
        const display = get(PickDisplayAtom);
        const category = get(PickCategoryAtom);
        const type = get(PickTypeAtom);
        const active = get(PickActiveAtom);

        const mediaIds = media.map(e => e.id);
        return {mediaIds, display, category, type, active}
    }
})

interface EditPick {
    modify?: PicksList;
}

export interface PickUpdate extends Omit<EditPickInterface, "media"> {
    mediaIds: number[]
}

export const EditPickContext = atom<EditPick | null>({
    key: 'EditPickContext',
    default: null
})

function useReset() {
    const media = useResetRecoilState(PickMediaAtom);
    const search = useResetRecoilState(SearchPickAtom);
    const active = useResetRecoilState(PickActiveAtom);
    const display = useResetRecoilState(PickDisplayAtom);
    const category = useResetRecoilState(PickCategoryAtom);
    const type = useResetRecoilState(PickTypeAtom);

    return () => {
        media();
        search();
        active();
        display();
        category();
        type();
    }
}

function Tail({close}: { close: () => void }) {
    const update = useRecoilValue(UpdateSelector);
    const setInform = useSetRecoilState(InformDisplayContext);

    const handleClick = async () => {
        if (update.mediaIds.length && update.display !== '' && update.category !== '') {
            const confirm = await pFetch({...update}, '/api/update/editorPicks');
            if (confirm)
                setInform({
                    type: "alert",
                    heading: 'Editor pick added successfully',
                    message: `The editor pick ${update.display}, has been added successfully`
                })
            else setInform({
                type: "warn",
                heading: 'Something went wrong',
                message: `Failed to add the editor pick ${update.display} to the database`
            })
            close();
        } else setInform({
                type: "error",
                heading: 'Missing fields must be provided',
                message: 'Some required fields like display, category or media were not provided'
            })
    }

    return (
        <div className={ss.tail}>
            <Template id={1} type={'none'} name={'submit'} onClick={handleClick}/>
        </div>
    )
}

function Image({obj}: { obj: PickMedia }) {
    const type = useRecoilValue(PickTypeAtom);
    const setMedia = useSetRecoilState(PickMediaAtom);
    const setSearch = useSetRecoilState(SearchPickAtom);

    const handleClick = () => {
        setSearch([]);
        setMedia(media => {
            if (media.some(e => e.id === obj.id))
                return media.filter(e => e.id !== obj.id);

            else return [...media, obj];
        })
    }

    if (type === PickType.BASIC)
        return (
            <img onClick={handleClick} src={obj.poster} alt={obj.name} className={style.resImage}/>
        )

    else return (
        <div onClick={handleClick} className={ss.pickImgHolder}>
            <img className={ss.img1} src={obj.backdrop} alt={obj.name}/>
            <img className={ss.img2} src={obj.logo} alt={obj.name}/>
        </div>
    )
}

function PickBodyHead({obj}: { obj: EditPick }) {
    const [text, setText] = useState('');
    const {response} = useFetcher<EditPickInterface>('/api/update/getPick?value=' + obj.modify?.category);
    const {response: search, abort} = useFetcher<UpdateSearch[]>('/api/update/libSearch?value=' + text);
    const setPickAtom = useSetRecoilState(PickMediaAtom);
    const setSearch = useSetRecoilState(SearchPickAtom);
    const setType = useSetRecoilState(PickTypeAtom);
    const setActive = useSetRecoilState(PickActiveAtom);
    const setCategory = useSetRecoilState(PickCategoryAtom);
    const setDisplay = useSetRecoilState(PickDisplayAtom);

    useEffect(() => {
        setActive(response?.active || false);
        setType(response?.type || 'EDITOR');
        setDisplay(response?.display || '');
        setCategory(response?.category || '');
        setPickAtom(response?.media || []);
    }, [response])

    useEffect(() => {
        setSearch(search || [])
    }, [search])

    useEffect(() => {
        if (text === '')
            abort.cancel();

        return () => abort.cancel();
    }, [text])

    return (
        <>
            <div className={ss.inputHolders}>
                <div className={ss.search}>
                    <input type="text" placeholder="enter category" defaultValue={obj.modify?.category}
                           onChange={e => setCategory(e.currentTarget.value)}
                           className={style['search-input']}/>
                </div>
                <div className={ss.search}>
                    <input type="text" placeholder="add new media to your pick" className={style['search-input']}
                           onChange={e => setText(e.currentTarget.value)}/>
                    <button className={style.searchButton}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </div>
                <div className={ss.search}>
                    <input type="text" placeholder="enter the display value" defaultValue={obj.modify?.display}
                           onChange={e => setDisplay(e.currentTarget.value)}
                           className={style['search-input']}/>
                </div>
            </div>
            <div className={ss.inputHolders}>
                <select className={ss.select} name="editor"
                        value={response?.type}
                        onChange={e => setType(e.currentTarget.value === PickType.EDITOR ? PickType.EDITOR : PickType.BASIC)}>
                    <option value="EDITOR">editor</option>
                    <option value="BASIC">basic</option>
                </select>
                <select className={ss.select} name="active"
                        value={response?.active ? 'active' : 'hidden'}
                        onChange={e => setActive(e.currentTarget.value === 'active')}>
                    <option value="hidden">hidden</option>
                    <option value="active">active</option>
                </select>
            </div>
        </>
    )
}

function PickBody({obj}: { obj: EditPick }) {
    const type = useRecoilValue(PickTypeAtom);
    const data = useRecoilValue(PickGridSelector);

    return (
        <div className={ss.pickBody}>
            <PickBodyHead obj={obj}/>
            <div className={ss.pickGrid}
                 style={type === 'BASIC' ? {gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr'} : {gridTemplateColumns: '1fr 1fr 1fr'}}>
                {data.map((e, v) => <Image obj={e} key={v}/>)}
            </div>
        </div>
    )
}

export default function ManagePick() {
    const [state, dispatch] = useRecoilState(EditPickContext);
    const [open, setOpen] = useState(true);
    const reset = useReset();

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
                        <img className={ss.bckImg} src={state.modify?.poster} alt={state.modify?.display}/>
                        <div className={ss.hold}>
                            <div className={ss.head}>
                                <div>{state.modify?.display ? 'Modify ' + state.modify.display : `Create new editor's pick`}</div>
                            </div>
                            <PickBody obj={state}/>
                            <Tail close={close}/>
                        </div>
                    </div>
                </div>
            </>
        )

    else return null;
}