import Entities from "../../entities/multipleEntities/multipleEntity";
import Details from "../details/fullDetails";
import React, {Suspense, useEffect, useRef} from "react";
import styles from '../Info.module.css';
import ss from '../../entities/Sections.module.css';
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    InfoEpisodesContext,
    InfoMediaIdContext,
    InformSeasonContext,
    InfoSeasonContext,
    InfoSeasonsContext, InfoSectionContext
} from "../infoContext";
import {SpringMedia} from "../../../../../server/classes/media";

const SectionLoading = () => {
    return (
        <div className={ss.sectionContainer}>
            <div style={{height: '300px'}} className={ss.sectionList}>
                <div style={{height: '200px'}} className={`${ss.sectionHolderLoading} ${ss.loading}`}/>
            </div>
        </div>
    )
}

function Sections({response}: { response: SpringMedia }) {
    const {seasons, section} = useRecoilValue(InfoEpisodesContext);

    return (
        <>
            {
                section === 'More like this' || section === 'Surprise me!' ?
                    <div className="sectionContainer">
                        <Entities section={true} response={response.recommendations!} type={'BASIC'}/>
                    </div> :
                    section === 'Details' ?
                        <Details response={response}/> :
                        <Entities section={true} response={seasons} type={'SECTION'}/>
            }
        </>
    )
}

export default function InfoSections({response, setReference}: { response: SpringMedia, setReference: ((arg: Element | null) => void) }) {
    const [sections, setSections] = useRecoilState(InformSeasonContext);
    const reference = useRef<HTMLDivElement>(null);
    const [section, setSection] = useRecoilState(InfoSectionContext)
    const isServer = typeof window === "undefined";
    const setSeasons = useSetRecoilState(InfoSeasonsContext)
    const season = useRecoilValue(InfoSeasonContext);
    const setMedia = useSetRecoilState(InfoMediaIdContext);

    useEffect(() => {
        setSeasons(response.seasons || []);
        setSection(response.sections[0]);
        setSections(response.sections);
        setMedia(response.id);
    }, [])

    useEffect(() => {
        setReference(reference.current)
    }, [reference])

    return (
        <>
            <div className={styles.a}>
                <ul className={styles.infoSection}>
                    {sections.map(item => <li key={item} className={item === section ? styles.infoSectionActive : ''}
                                                   onClick={() => setSection(item)}>{item}</li>)}
                </ul>
                <div className={styles.svg} style={season === 0 ? {visibility: "hidden"} : {}} onClick={() => {
                    setSection(response.sections[0]);
                }}>x
                </div>
            </div>
            <div className={styles.spacer} ref={reference}/>
            {isServer ? <SectionLoading/> :
                <Suspense fallback={<SectionLoading/>}>
                    <Sections response={response}/>
                </Suspense>
            }
        </>
    )
}
