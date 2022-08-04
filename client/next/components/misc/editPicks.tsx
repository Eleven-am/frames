import {useCallback, useEffect, useState} from "react";
import {EditPickContext, PickSearchContext, PickSelectorContext, useEditorPicks} from "../../../utils/modify";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import ss from "./MISC.module.css";
import {FramesButton} from "../buttons/Buttons";
import {useFetcher} from "../../../utils/customHooks";
import style from '../settings/ACCOUNT.module.css';
import {PickType} from "@prisma/client";
import {UpdateSearch} from "../../../../server/classes/pickAndFrame";

function Tail({close}: { close: () => void }) {
    const {addPick} = useEditorPicks();

    return (
        <div className={ss.tail}>
            <FramesButton type='primary' state={close} label='Submit' onClick={addPick}/>
        </div>
    )
}

function PickBody() {
    const type = useRecoilValue(EditPickContext).type;
    const data = useRecoilValue(PickSelectorContext);

    return (
        <div className={ss.pickBody}>
            <PickBodyHead/>
            <div className={ss.pickGrid}
                 style={type === 'BASIC' ? {gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr'} : {gridTemplateColumns: '1fr 1fr 1fr'}}>
                {data.map((e, v) => <Image obj={e} key={v}/>)}
            </div>
        </div>
    )
}

function Image({obj}: { obj: UpdateSearch }) {
    const {modifyPick} = useEditorPicks();
    const {type} = useRecoilValue(EditPickContext);

    const handleClick = useCallback(() => {
        modifyPick(obj);
    }, [obj, modifyPick]);

    if (type === PickType.BASIC)
        return (
            <img onClick={handleClick} src={obj.poster} alt={obj.name} className={style.resImage}/>
        )

    else return (
        <div onClick={handleClick} className={ss.pickImgHolder}>
            <img className={ss.img1} src={obj.backdrop} alt={obj.name}/>
            <img className={ss.img2} src={obj.logo || ''} alt={obj.name}/>
        </div>
    )
}

const PickBodyHead = () => {
    const [obj, setObj] = useRecoilState(EditPickContext);
    const setSearch = useSetRecoilState(PickSearchContext);
    const [text, setText] = useState('');
    const {abort} = useFetcher<UpdateSearch[]>('/api/settings/libSearch?value=' + text, {
        onSuccess: (res) => setSearch(res),
    });

    useEffect(() => {
        if (text === '')
            abort.cancel();

        return () => abort.cancel();
    }, [text]);

    return (
        <>
            <div className={ss.inputHolders}>
                <div className={ss.search}>
                    <input type="text" placeholder="enter category" value={obj.category}
                           onChange={e => setObj({...obj, category: e.target.value})}
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
                    <input type="text" placeholder="enter the display value" defaultValue={obj.display}
                           onChange={e => setObj({...obj, display: e.target.value})}
                           className={style['search-input']}/>
                </div>
            </div>
            <div className={ss.inputHolders}>
                <select className={ss.select} name="editor"
                        value={obj.type}
                        onChange={e => setObj({
                            ...obj,
                            type: e.currentTarget.value === PickType.EDITOR ? PickType.EDITOR : PickType.BASIC
                        })}>
                    <option value="EDITOR">editor</option>
                    <option value="BASIC">basic</option>
                </select>
                <select className={ss.select} name="active"
                        value={obj.active ? 'active' : 'hidden'}
                        onChange={e => setObj({...obj, active: e.currentTarget.value === 'active'})}>
                    <option value="hidden">hidden</option>
                    <option value="active">active</option>
                </select>
            </div>
        </>
    )
}

export default function ManagePick() {
    const [state, dispatch] = useRecoilState(EditPickContext);
    const [open, setOpen] = useState(true);

    const close = useCallback(() => {
        setOpen(false)
        setTimeout(() => {
            setOpen(true);
            dispatch(prev => ({...prev, statusType: false}))
        }, 200)
    }, [])

    if (state.statusType)
        return (
            <div className={`${ss.block} ${open ? ss.o : ss.c}`} onClick={close}>
                <div className={ss.container} onClick={e => e.stopPropagation()}>
                    <img className={ss.bckImg} src={state.poster} alt={state.display}/>
                    <div className={ss.hold}>
                        <div className={ss.head}>
                            <div>{state.process === 'MODIFY' ? 'Modify ' + state.display : `Create new editor's pick`}</div>
                        </div>
                        <PickBody/>
                        <Tail close={close}/>
                    </div>
                </div>
            </div>
        )

    else return null;
}
