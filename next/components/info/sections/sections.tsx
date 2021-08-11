import Entities from "../../entities/multipleEntities/multipleEntity";
import Details from "../details/fullDetails";
import React, {Suspense, useEffect, useRef} from "react";
import styles from '../Info.module.css';
import ss from '../../entities/Sections.module.css';
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    InfoDivAtom,
    InfoEpisodesContext,
    InfoMediaIdContext,
    InformSeasonContext,
    InfoSeasonContext,
    InfoSeasonsContext,
    InfoSectionContext,
    InfoStartHeight
} from "../../../states/infoContext";
import {SpringMediaInfo} from "../../../../server/classes/springboard";

const SectionLoading = () => {
    return (
        <div className={ss.sectionContainer}>
            <div style={{height: '300px'}} className={ss.sectionList}>
                <div style={{height: '200px'}} className={`${ss.sectionHolderLoading} ${ss.loading}`}/>
            </div>
        </div>
    )
}

function Sections({response}: { response: SpringMediaInfo }) {
    const {seasons, section} = useRecoilValue(InfoEpisodesContext);

    return (
        <>
            {
                section === 'More like this' || section === 'Surprise me!' ?
                    <div className="sectionContainer">
                        <Entities section={true} response={response.recommendations!} type={'basic'}/>
                    </div> :
                    section === 'Details' ?
                        <Details response={response}/> :
                        <Entities section={true} response={seasons} type={'section'}/>
            }
        </>
    )
}

export default function InfoSections({response}: { response: SpringMediaInfo }) {
    const [sections, setSections] = useRecoilState(InformSeasonContext);
    const reference = useRef<HTMLDivElement>(null);
    const [section, setSection] = useRecoilState(InfoSectionContext)
    const isServer = typeof window === "undefined";
    const setSeasons = useSetRecoilState(InfoSeasonsContext)
    const season = useRecoilValue(InfoSeasonContext);
    const setHeight = useSetRecoilState(InfoStartHeight);
    const setMedia = useSetRecoilState(InfoMediaIdContext);
    const setReference = useSetRecoilState(InfoDivAtom);

    useEffect(() => {
        setSeasons(response.seasons || []);
        setSection(response.section![0]);
        setSections(response.section!);
        setMedia(response.id);
    }, [])

    useEffect(() => {
        const height = reference.current?.getBoundingClientRect().top;
        setReference(reference.current)
        setHeight(height);
    }, [reference])

    return (
        <>
            <div className={styles.a}>
                <ul className={styles.infoSection}>
                    {sections.map((item, v) => <li key={v} className={item === section ? styles.infoSectionActive : ''}
                                                   onClick={() => setSection(item)}>{item}</li>)}
                </ul>
                <div className={styles.svg} style={season === 0 ? {visibility: "hidden"} : {}} onClick={() => {
                    setSection(response.section![0]);
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
