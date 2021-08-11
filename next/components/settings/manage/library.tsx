import ss from "../ACCOUNT.module.css";
import React, {useEffect, useState} from "react";
import {FrontBit, FrontTmDB, UpdateSearch} from "../../../../server/classes/update";
import {useSetRecoilState} from "recoil";
import {EditMediaContext} from "../../../utils/editMedia";
import {InformDisplayContext} from "../../misc/inform";
import {Template} from "../../buttons/Buttons";
import {useFetcher} from "../../../utils/customHooks";
import {Loading} from "../../misc/Loader";

const SearchRes = ({obj}: { obj: UpdateSearch }) => {
    const dispatch = useSetRecoilState(EditMediaContext);

    return (
        <div className={ss.res} onClick={() => dispatch({
            media: {id: obj.id, type: obj.type, backdrop: '' + obj.backdrop, name: obj.name, poster: obj.poster, logo: '' + obj.logo}
        })}>
            <img src={obj.backdrop} alt={obj.name} className={ss.resImage}/>
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.name}</span>
                </div>
                <p className="overview">{obj.overview}</p>
            </div>
        </div>
    )
}

const UnScanned = ({obj}: { obj: FrontBit }) => {
    const dispatch = useSetRecoilState(EditMediaContext);

    return (
        <div className={ss.res} onClick={() => dispatch({unScan: obj})}>
            <img src={obj.res.length === 1 ? '' + obj.res[0].backdrop : '/frames.png'} alt={'' + obj.file.name}
                 className={obj.res.length === 1 ? ss.resImage : ss.resPerson}/>
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.file.name}</span>
                </div>
                <p className="overview">{obj.res.length ? obj.res.length === 1 ? 'Found an exact match' : 'Found ' + obj.res.length + ' matches' : 'No match found'}</p>
            </div>
        </div>
    )
}

export default function Library() {
    const [text, setText] = useState('');
    const [unScan, setUnScan] = useState<FrontBit[]>([]);
    const {response: search, abort} = useFetcher<UpdateSearch[]>('/api/update/libSearch?value=' + text);
    const dispatch = useSetRecoilState(InformDisplayContext);
    const [load, setLoad] = useState(false);

    useEffect(() => {
        if (text === '')
            abort.cancel();
    }, [text])

    const unScanned = async () => {
        setText('');
        setUnScan([]);
        setLoad(true);
        const res = await fetch('/api/update/missing');
        const data: FrontTmDB = await res.json();
        setLoad(false);
        setUnScan(data.movies.concat(data.shows));
    }

    const libraryScan = async (index: number) => {
        const routes = ['lib', 'episode', 'sub'];
        dispatch({
            type: "alert",
            heading: 'Library scan begun',
            message: 'Frames would begin scanning your files shortly'
        });
        const res = await fetch('/api/update/' + routes[index] + 'Scan');
        await res.json();
    }

    return (
        <div className={ss.data}>
            <div className={ss.searchContainer}>
                <div className={ss['search-holder']}>
                    <input type="text" onChange={e => setText(e.currentTarget.value)}
                           placeholder="find some media to modify" className={ss['search-input']}/>
                    <button className={ss.searchButton}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className={ss.butContainers}>
                {search?.length || unScan.length ? search?.length ? <div className={ss.searchRes}>
                    {search.map((e, v) => <SearchRes key={v} obj={e}/>)}
                </div> : <div className={ss.searchRes}>
                    {unScan.map((e, v) => <UnScanned key={v} obj={e}/>)}
                </div> :
                    <>
                        <div className={ss.buttons}>
                            <Template id={2} type={'scan'} name={'perform library scan'} onClick={() => libraryScan(0)}/>
                            <Template id={1} type={'info'} name={'handle unScanned items'} onClick={unScanned}/>
                            <Template id={0} type={'scan'} name={'scan episodes'} onClick={() => libraryScan(1)}/>
                            <Template id={2} type={'down'} name={'get missing subtitles'} onClick={() => libraryScan(2)}/>
                        </div>
                        {load? <Loading/>: null}
                    </>
                }
            </div>
        </div>
    )
}