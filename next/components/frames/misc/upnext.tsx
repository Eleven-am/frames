import {useRecoilValue, useSetRecoilState} from "recoil";
import {useRouter} from "next/router";
import {MediaType} from '@prisma/client';
import {differance, nextHolder, nextOver, UpNextURL} from "../../../states/FramesStates";
import {BackButton, InfoButton, PlayButton} from "../../buttons/Buttons";
import React, {useEffect} from "react";
import {useFetcher} from "../../../utils/customHooks";
import cd from '../frames.module.css';
import ss from '../misc.module.css';
import Media from "../../entities/singleEntity/media";
import {SpringPlay} from "../../../../server/classes/springboard";
import {DetailedEpisode} from "../../../../server/classes/episode";
import {UpNextHolder as UPNXT} from "../../../../server/classes/playback";
import useGroupWatch from "../../../utils/groupWatch";

export default function UpNextHolder ({response}: {response: SpringPlay}) {
    const diff = useRecoilValue(differance);
    const data = useRecoilValue(nextHolder);
    const url = useRecoilValue(UpNextURL);
    const {pushNext} = useGroupWatch();
    const router = useRouter();

    const nextHandler = async () => {
        await pushNext(url);
        await router.push(url);
    }

    if (diff === '1s')
       nextHandler();

    if (data)
        return (
            <>
                <img src={data.backdrop} className={cd.pf} alt={data.episodeName || data.name}/>
                <div className={cd.upHldr}/>
                <div className={cd.hldr}>
                    <BackButton response={response}/>
                    {data.logo && data.logo !== '' ?
                        <img className={cd.lgo} src={data.logo} alt={data.episodeName || data.name}/> :
                        <div className={cd.nm}>{data.name}</div>
                    }

                    <div className={cd.epi}>Up next: {data.episodeName || data.name}</div>
                    <p>{data.overview}</p>
                    <div className={cd.but}>
                        <PlayButton id={data.mediaId} name={'plays in: ' + diff} url={url}/>
                        <InfoButton id={data.mediaId} name={data.name} type={data.episodeName ? 'show': 'movie'}/>
                    </div>
                </div>
            </>
        )

    else return null;
}

export function UpNextMini({response}: {response: SpringPlay}) {
    const next = useRecoilValue(nextOver);
    const setUpNext = useSetRecoilState(nextHolder);
    const setUrl = useSetRecoilState(UpNextURL);
    const {response: upNext} = useFetcher<DetailedEpisode>( (response.playlistId ? '/api/stream/playlist?media=' : '/api/stream/next?media=') + (response.playlistId || response.videoId), {dedupingInterval: 10800000});
    const tempUrl = upNext ? '/api/stream/nextImage?media=' + (upNext.type === 'MOVIE'? '' : 'e') + upNext.id: '';
    const {response: data, abort} = useFetcher<UPNXT>(tempUrl);

    useEffect(() => {
        if (upNext === null)
            abort.cancel();

        else {
            if (upNext) {
                if (upNext.playlistId)
                    setUrl('/watch?next=x' + upNext.playlistId);

                else
                    setUrl('/watch?next=' + (upNext.type === MediaType.MOVIE ? '' : 'e') + upNext.id);
            }

            setUpNext(data || null);
        }

        return () => abort.cancel();
    }, [data, upNext])

    if (upNext)
        return (
            <div className={ss.un} style={next? {opacity: "1"} : {visibility: "hidden"}}>
                <Media data={upNext} media={true}/>
                <div className={ss.p}><p>{upNext.overview}</p></div>
            </div>
        )

    else return null;
}
