import React, {useEffect, useRef, useState} from "react";
import info from "./Info.module.css";
import styles from '../trending/backdrop/BACKDROP.module.css'
import InfoSections from "./sections/sections";
import InfoDetails from "./details/infoDetails";
import {useYoutubePLayer} from "../../utils/customHooks";
import {InfoDivAtom, InfoOpacitySelector, InfoSectionAtom, infoTrailerContext} from "../../states/infoContext";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {PlayButton, TrailerButton} from "../buttons/Buttons";
import {NavOpacityAtom} from "../../states/navigation";
import {SpringMediaInfo} from "../../../server/classes/springboard";

export default function Info({response}: { response: SpringMediaInfo }) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const reference = useRecoilValue(InfoDivAtom);
    const setHeight = useSetRecoilState(InfoSectionAtom)
    const imgRef = useRef<HTMLImageElement>(null);
    const {start, loadTrailer, done} = useYoutubePLayer(imgRef, backdropRef, response.trailer || '', infoTrailerContext);
    const [move, setMove] = useState(false);
    const {height, lowOpacity} = useRecoilValue(InfoOpacitySelector);
    const setOpacity = useSetRecoilState(NavOpacityAtom);

    useEffect(() => {
        let timer1 = setTimeout(() => setMove(start),start ? 10: 410);
        return () => {
            clearTimeout(timer1);
        };
    }, [start])

    const handleScroll = () => {
        let startHeight = reference?.getBoundingClientRect().top;
        setHeight(startHeight);
    }

    useEffect(() => {
        setOpacity((height < 0.5 ? 1.3: 0.9) - height);
        if (backdropRef.current) {
            backdropRef!.current.style.background = `linear-gradient(to right, rgba(1, 16, 28, ${(height > 0.7? 0.7: height) + 0.2}), rgba(1, 16, 28, ${lowOpacity > 0.4? 0.4: lowOpacity})),
            linear-gradient(to top, rgba(1, 16, 28, ${(height > 0.7? 0.7: height)}), rgba(1, 16, 28, ${lowOpacity > 0.4? 0.4: lowOpacity})),
            linear-gradient(45deg, rgba(1, 16, 28, ${(height > 0.7? 0.7: height)}), rgba(1, 16, 28, ${lowOpacity > 0.4? 0.4: lowOpacity}))`;
        }
    }, [height, lowOpacity])

    return (
        <div className={info.infoHolder}>
            <img
                className={start ? `${styles.bannersBackdrop} ${styles.fade_img}` : done ? styles.bannersBackdrop : `${styles.bannersBackdrop} ${styles.glow_img}`}
                ref={imgRef} src={response.backdrop} alt={response.name}/>
            <div className={info['info-holders']} ref={backdropRef} onScroll={() => handleScroll()}>
                {start || move ?
                    <div className={info.trailer} style={ start && move ? {left: '-10%', bottom: '-50%', transform: 'scale(0.8)'}: {}}>
                        <div className={info.infoNaming}>
                            {response.logo ? <img src={response.logo} alt={response.name}/> : <span className="infoLogo">{response.name}</span>}
                        </div>
                        <div className={info.infoButtons}>
                            <PlayButton id={response.id}/>
                            <TrailerButton id={response.id} trailer={start} onClick={loadTrailer}/>
                        </div>
                    </div>
                    : <>
                        <InfoDetails response={response} loadTrailer={loadTrailer}/>
                        <InfoSections response={response}/>
                    </>
                }
            </div>
        </div>
    );
}