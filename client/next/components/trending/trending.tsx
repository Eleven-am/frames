import Backdrop from "./backdrop/backdrop";
import React, {useEffect, useMemo} from "react";
import {OpacityHomeAtom, useReset} from "../homeSection/homeContext";
import {subscribe, useLoop, useYoutubePLayer} from "../../../utils/customHooks";
import {Banner} from "../../../../server/classes/media";
import styles from "./backdrop/BACKDROP.module.css";
import {useRecoilValue} from "recoil";

export default function Trending({response, stop}: { stop: boolean, response: Banner[] }) {
    const {current, prev, switchTo, clear, restart} = useLoop({start: 0, end: response.length});
    const {loadTrailer, done, start, destroyTrailer} = useYoutubePLayer();
    const {holderOpacity} = useRecoilValue(OpacityHomeAtom);

    const reset = useReset();

    useEffect(() => {
        return () => reset();
    }, [])

    useEffect(() => {
        if (stop && start)
            destroyTrailer();
    }, [stop])

    subscribe((start) => {
        if (start)
            clear();
    }, start)

    subscribe((done) => {
        if (done)
            restart();
    }, done)

    subscribe((current) => {
        if (current && start)
            destroyTrailer();
    }, current)

    const carousel = useMemo(() => [...Array(response.length).keys()], [response]);

    return (
        <div>
            {response.map((item, index) =>
                <Backdrop key={item.id}
                          data={item} start={start} done={done}
                          loadTrailer={loadTrailer} index={index === current || index === prev ? index === current : null}
                />
            )}
            <nav className={styles.carousel} style={{opacity: holderOpacity}}>
                {carousel.map((start: number, value: number) => {
                    return (<svg viewBox="0 0 24 24" key={value} onClick={() => switchTo(start, response.length)}
                                 className={current === start ? styles.activeCarousel : styles.passiveCarousel}>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>)
                })}
            </nav>
        </div>
    );
}
