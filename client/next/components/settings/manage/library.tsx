import {useEffect, useState} from "react";
import ss from "../ACCOUNT.module.css";
import {useFetcher} from "../../../../utils/customHooks";
import useModify, {EditFrontMediaAtom, UnsavedFrontMediaAtom} from "../../../../utils/modify";
import {Image, Loading} from "../../misc/Loader";
import {FramesButton} from "../../buttons/Buttons";
import {useRecoilState, useSetRecoilState} from "recoil";
import frames from '../../../assets/frames.png';
import {UpdateSearch} from "../../../../../server/classes/pickAndFrame";
import {MedForMod} from "../../../../../server/classes/media";
import useBase from "../../../../utils/provider";

export interface Settings<S> {
    id: S;
    name: string;
    overview: string;
    backdrop: string;
    className?: boolean;
    imgClass?: boolean;
    onClick: (id: S) => void;
}

export function SearchRes<S>(obj: Settings<S>) {
    return (
        <div className={obj.className ? `${ss.res} ${ss.had}` : ss.res} onClick={() => obj.onClick(obj.id)}>
            {obj.backdrop !== '' ?
                <img src={obj.backdrop} alt={obj.name} className={obj.imgClass ? ss.resPerson : ss.resImage}/> :
                <Image src={frames} className={ss.resPerson} alt={obj.name}/>}
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.name}</span>
                </div>
                <p>{obj.overview}</p>
            </div>
        </div>
    )
}

export default function Library() {
    const base = useBase();
    const setMedia = useSetRecoilState(EditFrontMediaAtom);
    const {scanAllMedia, scanAllEpisodes, scanAllSubs, getMedia} = useModify();
    const [text, setText] = useState('');
    const [unScan, setUnScan] = useRecoilState(UnsavedFrontMediaAtom);
    const [load, setLoad] = useState(false);
    const {response: search, abort} = useFetcher<UpdateSearch[]>('/api/settings/libSearch?value=' + text);

    useEffect(() => {
        if (text === '')
            abort.cancel();

        return () => abort.cancel();
    }, [text]);

    useEffect(() => {
        return () => {
            abort.cancel();
            setUnScan([]);
        }
    }, []);

    const getUnScanned = async () => {
        setText('');
        setUnScan([]);
        setLoad(true);
        const res = await base.makeRequest<MedForMod[]>('/api/settings/libUnScanned', null);
        setLoad(false);
        setUnScan(res || []);
    }

    const onScanClick = (id: string) => {
        const file = unScan.find(x => x.file!.location === id);
        file && setMedia({...file, location: file.file!.location});
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
                {search?.length || unScan.length ? search?.length ?
                        <div className={ss.searchRes}>
                            {search.map((e, v) => <SearchRes key={v} {...e} onClick={getMedia}/>)}
                        </div> :
                        <div className={ss.searchRes}>
                            {unScan.map((e, v) => {
                                const obj = {
                                    id: e.file!.location,
                                    name: e.file!.name!,
                                    overview: e.suggestions.length === 1 ? 'Found an exact match' : 'Found ' + e.suggestions.length + ' matches',
                                    backdrop: e.backdrop,
                                    onClick: onScanClick
                                }
                                return <SearchRes key={v} {...obj}/>
                            })}
                        </div> :
                    <>
                        <div className={ss.buttons}>
                            <FramesButton type='round' icon='scan' tooltip={'perform library scan'} onClick={scanAllMedia}/>
                            <FramesButton type='secondary' icon='info' label={'handle unScanned items'} onClick={getUnScanned}/>
                            <FramesButton type='primary' icon='scan' label={'scan episodes'} onClick={scanAllEpisodes}/>
                            <FramesButton type='round' icon='down' tooltip={'get missing subtitles'} onClick={scanAllSubs}/>
                        </div>
                        {load ? <Loading/> : null}
                    </>
                }
            </div>
        </div>
    )
}