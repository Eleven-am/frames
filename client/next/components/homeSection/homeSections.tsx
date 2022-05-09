import React, {useRef, useEffect} from 'react';
import Section from "../entities/section";
import styles from './homeSections.module.css';
import {useSetRecoilState} from "recoil";
import {sectionAtom, startHeight} from "./homeContext";
import {useHomeSegments} from "../../../utils/customHooks";

export default function HomeSections ({stop}: {stop: (s: boolean) => void}) {
    const {segment: response, handleScroll, setCallback} = useHomeSegments();
    const setHeight = useSetRecoilState(startHeight);
    const setSection = useSetRecoilState(sectionAtom);
    const divRef = useRef<HTMLDivElement>(null);

    setCallback(() => {
        if (divRef.current) {
            let startHeight = divRef.current?.getBoundingClientRect().top;
            setSection(startHeight);
            stop(true);
        }
    })

    useEffect(() => {
        if (response){
            let startHeight = divRef.current?.getBoundingClientRect().top;
            setHeight(startHeight);
        }
    }, [])

    return (
        <div className={styles.sectionScroll} onScroll={handleScroll}>
            <div className={styles.sectionsHolder} ref={divRef}>
                {response.map(item => {
                    return <Section key={item} location={item}/>
                })}
            </div>
        </div>
    )
}
