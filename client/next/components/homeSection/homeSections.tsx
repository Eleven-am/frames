import React, {memo, useEffect, useRef} from 'react';
import Section, {TrendingCollection} from "../entities/section";
import styles from './homeSections.module.css';
import {useSetRecoilState} from "recoil";
import {sectionAtom, startHeight} from "./homeContext";
import {useHomeSegments} from "../../../utils/customHooks";
import ErrorBoundary from "../misc/ErrorBoundary";

function HomeSections({stop}: { stop: (s: boolean) => void }) {
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
        if (response) {
            let startHeight = divRef.current?.getBoundingClientRect().top;
            setHeight(startHeight);
        }
    }, [])

    return (
        <ErrorBoundary>
            <div className={styles.sectionScroll} onScroll={handleScroll}>
                <div className={styles.sectionsHolder} ref={divRef}>
                    {response.map(item => {
                        if (item === 'trendingCollection')
                            return <TrendingCollection key={item}/>

                        return <Section key={item} location={item}/>
                    })}
                </div>
            </div>
        </ErrorBoundary>
    )
}

export default memo(HomeSections);
