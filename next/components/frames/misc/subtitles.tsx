import {useRecoilValue, useSetRecoilState} from "recoil";
import {useCallback, useEffect, useState} from "react";
import ss from '../misc.module.css';
import {capitalize} from "../../../utils/baseFunctions";
import subs from '../frames.module.css';
import {activeSubs, FramesSubs, framesSubtitles, subOverAtom, SubtitlesAtom} from "../../../states/FramesStates";
import axios from "axios";
import {SpringPlay} from "../../../../server/classes/springboard";
import {Subtitles as Subs} from '../../../../server/classes/playback';

export const Subtitles = ({response}: {response: SpringPlay}) => {
    const [within, setWithin] = useState(false);
    const setActiveSub = useSetRecoilState(activeSubs);
    const setSubs = useSetRecoilState(framesSubtitles);
    const sub = useRecoilValue(subOverAtom);

    const getSubs = useCallback(async () => {
        const subtitles: FramesSubs[] = []
        if (response.subs?.length) {
            for (let sub of response.subs) {
                if (sub !== undefined) {
                    const temp = subtitles.find((e: { language: any; }) => e.language === sub!.language)
                    if (temp === undefined) {
                        const res = await axios(sub.url);
                        const data: Subs = await res.data;
                        subtitles.push({language: sub.language, data})
                    }
                }
            }
        }

        setSubs([...subtitles]);
    }, [response])

    useEffect(() => {
        getSubs()
    }, [response])

    return (
        <div onClick={(event) => event.stopPropagation()}
             onMouseEnter={() => setWithin(true)} onMouseLeave={() => setWithin(false)} className={ss.subH}
             style={sub || within ? {opacity: 1} : {visibility: "hidden"}}>
            <div className={ss.subE} onClick={() => setActiveSub('none')}>None</div>
            {response && response.subs ? response.subs.map((e, v) =>
                <Sub sub={e} key={v}/>
            ) : null}
        </div>
    )
}

const Sub = ({sub}: { sub: { language: string, url: string } }) => {
    const setActiveSub = useSetRecoilState(activeSubs);

    if (sub && sub.url !== '')
        return (
            <>
                <div className={ss.subD}/>
                <div className={ss.subE}
                     onClick={() => setActiveSub(sub.language)}>{capitalize(sub.language)}</div>
            </>
        )

    else return null;
}

export const SubDisplay = () => {
    const sub = useRecoilValue(SubtitlesAtom);

    if (sub)
        return (
            <div className={subs.subs}
                 style={sub.move ? {bottom: '20vh'} : {}}>
                <div>{sub.display}</div>
            </div>
        )

    else return null;
}