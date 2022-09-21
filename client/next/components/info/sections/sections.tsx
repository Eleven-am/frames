import Entities from "../../entities/multipleEntities/multipleEntity";
import Details from "../details/fullDetails";
import React, {memo, Suspense, useEffect, useRef} from "react";
import styles from '../Info.module.css';
import ss from '../../entities/Sections.module.css';
import {useRecoilState, useRecoilValue} from "recoil";
import {
    InfoContext,
    InfoEpisodesContext,
    InformSeasonContext,
    InfoSeasonContext,
    InfoSectionContext
} from "../infoContext";

const SectionLoading = memo(() => {
    return (
        <div className={ss.sectionContainer}>
            <div style={{height: '300px'}} className={ss.sectionList}>
                <div style={{height: '200px'}} className={`${ss.sectionHolderLoading} ${ss.loading}`}/>
            </div>
        </div>
    )
})

interface SectionsInterface {
    splitGenres: () => void;
    manageDecade: () => void
}

const Sections = memo((props: SectionsInterface) => {
    const response = useRecoilValue(InfoContext);
    const {seasons, section} = useRecoilValue(InfoEpisodesContext);

    if (!response) return null;

    return (
        <>
            {
                section === 'More like this' || section === 'Featured media' ?
                    <div className="sectionContainer">
                        <Entities section={true} response={response.recommendations} type={'BASIC'}/>
                    </div> :
                    section === 'Details' ?
                        <Details response={response} {...props}/> :
                        <Entities section={true} response={seasons} type={'SECTION'}/>
            }
        </>
    )
})

interface InfoSectionInterface extends SectionsInterface {
    setReference: ((arg: Element | null) => void)
}

function InfoSections({setReference, splitGenres, manageDecade}: InfoSectionInterface) {
    const response = useRecoilValue(InfoContext);
    const [sections, setSections] = useRecoilState(InformSeasonContext);
    const reference = useRef<HTMLDivElement>(null);
    const [section, setSection] = useRecoilState(InfoSectionContext)
    const isServer = typeof window === "undefined";
    const season = useRecoilValue(InfoSeasonContext);

    useEffect(() => {
        if (response) {
            setSection(response.sections[0]);
            setSections(response.sections);
        }
    }, [response])

    useEffect(() => {
        setReference(reference.current)
    }, [reference.current])

    if (!response) return null;

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
                    <Sections splitGenres={splitGenres} manageDecade={manageDecade}/>
                </Suspense>
            }
        </>
    )
}

export default memo(InfoSections);
