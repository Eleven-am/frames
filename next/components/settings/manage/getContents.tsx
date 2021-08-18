import React, {useEffect, useState} from "react";
import ss from "../ACCOUNT.module.css";
import {FrontSearch} from "../../../../server/base/tmdb_hook";
import {useSetRecoilState} from "recoil";
import {InformDisplayContext} from "../../misc/inform";
import {Template} from "../../buttons/Buttons";
import {sFetch} from "../../../utils/baseFunctions";
import {Loading} from "../../misc/Loader";

const SearchRes = ({obj, setSearchResponse, setLoad}: {obj: FrontSearch, setLoad: ((bool: boolean) => void), setSearchResponse: (res: FrontSearch[])=> void}) => {
    const dispatch = useSetRecoilState(InformDisplayContext);

    const getRec = async () => {
        if (!obj.recom){
            setSearchResponse([]);
            setLoad(true);
            const res = await fetch('/api/update/recommend?id=' + obj.id + '&lib=' + obj.type);
            const data: FrontSearch[] = await res.json();
            setSearchResponse(data);
            setLoad(false);

        } else if (obj.present){
            dispatch({
                type: "warn",
                heading: 'Existing Media',
                message: obj.name + ' already exists in your library as ' + obj.libName,
            })

        } else if (obj.type !== "person") {
            const res = await fetch('/api/update/download?id=' + obj.id + '&lib=' + obj.type);
            const data: boolean = await res.json();
            data ? dispatch({
                type: "alert",
                heading: 'Download started',
                message: 'Successfully started downloading ' + obj.name,
            }): dispatch({
                type: "error",
                heading: 'Failed to download',
                message: 'Unable to find ' + obj.name + ' for download',
            })
        }
    }

    return (
        <div className={obj.present && obj.recom ? `${ss.res} ${ss.had}` : ss.res} onClick={getRec}>
            <img src={obj.backdrop} alt={obj.name} className={obj.type === 'person' ? ss.resPerson : ss.resImage}/>
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.name}</span>
                </div>
                <p className="overview">{obj.overview}</p>
            </div>
        </div>
    )
}

export default function GetContents () {
    const [text, setText] = useState('');
    const dispatch = useSetRecoilState(InformDisplayContext);
    const [search, setSearchResponse] = useState<FrontSearch[]>([]);
    const [load, setLoad] = useState(false);
    const libraryScan = async (index: number) => {
        const routes = ['media', 'episode'];
        dispatch({
            type: "alert",
            heading: 'Media download begun',
            message: 'Frames would begin downloading mew media shortly'
        });
        const res = await fetch('/api/update/' + routes[index] + 'Down');
        await res.json();
    }

    const handleSearch = async (ac: AbortController) => {
        const data = await sFetch<FrontSearch[]>('/api/update/search?search='+text, ac);
        if (data)
            setSearchResponse(data);
    }

    useEffect(() => {
        const ac = new AbortController();
        if (text !== '') {
            handleSearch(ac);
        } else setSearchResponse([])
        return () => ac.abort();
    }, [text])

    return (
        <div className={ss.data}>
            <div className={ss.searchContainer}>
                <div className={ss['search-holder']}>
                    <input type="text" onChange={e => setText(e.currentTarget.value)} placeholder="find new media or people" className={ss['search-input']}/>
                    <button className={ss.searchButton}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className={ss.butContainers}>
                {
                    search.length ? <div className={ss.searchRes}>
                        {search.map((e, v) => <SearchRes key={v} obj={e} setSearchResponse={setSearchResponse} setLoad={setLoad}/>)}
                    </div>: <>
                        <div className={ss.buttons}>
                            <Template onClick={() => libraryScan(1)} id={0} name={'Download missing episodes'} type={'scan'}/>
                            <Template onClick={() => libraryScan(0)} id={1} name={'Download new media'} type={'down'}/>
                        </div>
                        {load? <Loading/>: null}
                    </>
                }
            </div>
        </div>
    )
}