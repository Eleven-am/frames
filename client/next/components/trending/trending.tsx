import Backdrop from "./backdrop/backdrop";
import React, {useEffect, useMemo, useState} from "react";
import {OpacityHomeAtom, useReset} from "../homeSection/homeContext";
import {subscribe, useFetcher, useLoop, useYoutubePLayer} from "../../../utils/customHooks";
import {Banner} from "../../../../server/classes/media";
import styles from "./backdrop/BACKDROP.module.css";
import {useRecoilValue} from "recoil";
import useBase from "../../../utils/provider";

export default function Trending({response, stop}: { stop: boolean, response: Banner[] }) {
    const base = useBase();
    const [banners, setBanners] = useState<Banner[]>(response)
    const {current, prev, switchTo, clear, restart} = useLoop({start: 0, end: banners.length});
    const {loadTrailer, done, start, destroyTrailer} = useYoutubePLayer();
    useFetcher<Banner | null>('/api/load/getRelevant', {
        revalidateOnFocus: false,
        onSuccess: (data: Banner | null) => {
            if (data) {
                setBanners(prevState => base.uniqueId([data, ...prevState], 'id'));
                switchTo(0, response.length + 1);
            }
        }
    });
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

    const carousel = useMemo(() => [...Array(banners.length).keys()], [banners]);

    return (
        <div>
            {banners.map((item, index) =>
                <Backdrop key={item.id}
                          data={item} start={start} done={done}
                          loadTrailer={loadTrailer} index={index === current || index === prev ? index === current : null}
                />
            )}
            <nav className={styles.carousel} style={{opacity: holderOpacity}}>
                {carousel.map((start: number, value: number) => {
                    return (<svg viewBox="0 0 24 24" key={value} onClick={() => switchTo(start, banners.length)}
                                 className={current === start ? styles.activeCarousel : styles.passiveCarousel}>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>)
                })}
            </nav>
        </div>
    );
}
