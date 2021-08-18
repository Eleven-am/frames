import React, {useEffect, useRef, useState} from "react";
import info from "./Info.module.css";
import styles from '../trending/backdrop/BACKDROP.module.css'
import InfoSections from "./sections/sections";
import InfoDetails from "./details/infoDetails";
import {useYoutubePLayer} from "../../utils/customHooks";
import {infoTrailerContext} from "../../states/infoContext";
import {PlayButton, TrailerButton} from "../buttons/Buttons";
import {SpringMediaInfo} from "../../../server/classes/springboard";
import useOnScroll from "../../utils/opacityScroll";

export default function Info({response}: { response: SpringMediaInfo }) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const {
        start,
        loadTrailer,
        done
    } = useYoutubePLayer(imgRef, backdropRef, response.trailer || '', infoTrailerContext);
    const {onScroll, values, setReference, reset} = useOnScroll();
    const [move, setMove] = useState(false);

    useEffect(() => {
        let timer1 = setTimeout(() => setMove(start), start ? 10 : 410);
        return () => {
            clearTimeout(timer1);
        };
    }, [start])

    useEffect(() => {
        const {height, lowOpacity} = values;
        if (backdropRef.current) {
            backdropRef!.current.style.background = `linear-gradient(to right, rgba(1, 16, 28, ${(height > 0.7 ? 0.7 : height) + 0.2}), rgba(1, 16, 28, ${lowOpacity > 0.4 ? 0.4 : lowOpacity})),
            linear-gradient(to top, rgba(1, 16, 28, ${(height > 0.7 ? 0.7 : height)}), rgba(1, 16, 28, ${lowOpacity > 0.4 ? 0.4 : lowOpacity})),
            linear-gradient(45deg, rgba(1, 16, 28, ${(height > 0.7 ? 0.7 : height)}), rgba(1, 16, 28, ${lowOpacity > 0.4 ? 0.4 : lowOpacity}))`;
        }
    }, [values])

    useEffect(() => {
        return () => reset();
    }, [])

    return (
        <div className={info.infoHolder}>
            <img
                className={start ? `${styles.bannersBackdrop} ${styles.fade_img}` : done ? styles.bannersBackdrop : `${styles.bannersBackdrop} ${styles.glow_img}`}
                ref={imgRef} src={response.backdrop} alt={response.name}/>
            <div className={info['info-holders']} ref={backdropRef} onScroll={onScroll}>
                {start || move ?
                    <div className={info.trailer}
                         style={start && move ? {left: '-10%', bottom: '-50%', transform: 'scale(0.8)'} : {}}>
                        <div className={info.infoNaming}>
                            {response.logo ? <img src={response.logo} alt={response.name}/> :
                                <span>{response.name}</span>}
                        </div>
                        <div className={info.infoButtons}>
                            <PlayButton id={response.id}/>
                            <TrailerButton id={response.id} trailer={start} onClick={loadTrailer}/>
                        </div>
                    </div>
                    : <>
                        <InfoDetails response={response} loadTrailer={loadTrailer}/>
                        <InfoSections response={response} setReference={setReference}/>
                    </>
                }
            </div>
        </div>
    );
}