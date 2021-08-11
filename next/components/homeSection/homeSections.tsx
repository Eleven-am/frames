import React, {useRef, useEffect} from 'react';
import Section from "../entities/section";
import styles from './homeSections.module.css';
import {useSetRecoilState} from "recoil";
import {sectionAtom, startHeight, TrailerAtom} from "../../states/homeContext";

export default function HomeSections ({response}: {response: string[]}) {
    const setHeight = useSetRecoilState(startHeight);
    const setSection = useSetRecoilState(sectionAtom);
    const setTrailer = useSetRecoilState(TrailerAtom);
    const divRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        let startHeight = divRef.current?.getBoundingClientRect().top;
        setTrailer(false);
        setSection(startHeight);
    }

    useEffect(() => {
        if (response){
            let startHeight = divRef.current?.getBoundingClientRect().top;
            setHeight(startHeight);
        }
    }, [])

    return (
        <div className={styles.sectionScroll} onScroll={() => handleScroll()}>
            <div className={styles.sectionsHolder} ref={divRef}>
                {response.map((item, index) => {
                    return <Section key={index} location={item}/>
                })}
            </div>
        </div>
    )
}
