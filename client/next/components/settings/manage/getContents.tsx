import React, {useEffect, useState} from "react";
import ss from "../ACCOUNT.module.css";
import {Template} from "../../buttons/Buttons";
import {useFetcher} from "../../../../utils/customHooks";
import {GetContentSearch} from "../../../../../server/classes/modify";
import {useRecoilState} from "recoil";
import {GetSearchContext, useGetContext} from "../../../../utils/modify";
import {Loading} from "../../misc/Loader";
import {MediaType} from "@prisma/client";
import {SearchRes} from "./library";

export default function GetContents() {
    const [text, setText] = useState('');
    const [search, setSearch] = useRecoilState(GetSearchContext);
    const {libraryScan, searchRecommendations, downloadMedia} = useGetContext();
    const {abort, loading} = useFetcher('/api/settings/outSearch?value=' + text, {
        revalidateOnFocus: false,
        onSuccess: (data: GetContentSearch[]) => {
            setSearch({data, loading: false});
        }
    });

    const manageRec = async (obj: GetContentSearch) => {
        if (!obj.download)
            await searchRecommendations(obj.id, obj.type);

        else {
            const type = obj.type === "MOVIE" ? MediaType.MOVIE : MediaType.SHOW;
            await downloadMedia(obj.id, type, obj.libraryName, obj.name);
        }
    };

    useEffect(() => {
        if (text === '') {
            abort.cancel();
            setSearch({data: [], loading: false});
        }

        return () => abort.cancel();
    }, [text]);

    return (
        <div className={ss.data}>
            <div className={ss.searchContainer}>
                <div className={ss['search-holder']}>
                    <input type="text" onChange={e => setText(e.currentTarget.value)}
                           placeholder="find new media or people" className={ss['search-input']}/>
                    <button className={ss.searchButton}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className={ss.butContainers}>
                {search.data.length ? null :
                    <div className={ss.buttons}>
                        <Template onClick={() => libraryScan('EPISODES')} id={0} name={'Download missing episodes'}
                                  type={'scan'}/>
                        <Template onClick={() => libraryScan('MEDIA')} id={1} name={'Download new media'}
                                  type={'down'}/>
                    </div>
                }
                {search.loading || (loading && text !== '') ?
                    <Loading/> : search.data.length ?
                        <div className={ss.searchRes}>
                            {search.data.map((e, v) => {
                                const obj = {
                                    className: e.libraryName !== null && e.download,
                                    imgClass: e.type === 'PERSON',
                                    name: e.name, overview: e.overview,
                                    id: e, onClick: manageRec, backdrop: e.backdrop || ''
                                }
                                return <SearchRes {...obj}/>
                            })}
                        </div> : null
                }
            </div>
        </div>
    )
}