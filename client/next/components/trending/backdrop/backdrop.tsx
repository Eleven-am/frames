import React, {useEffect, useRef} from "react";
import {PlayButton, Template, TrailerButton} from "../../buttons/Buttons";
import styles from "./BACKDROP.module.css";
import style from "./../Trending.module.css";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {MediaType} from "@prisma/client";
import {imageAtom, OpacityHomeAtom, pGraphAtom} from "../../homeSection/homeContext";
import {useYoutubePLayer} from "../../../../utils/customHooks";
import {NavOpacityAtom} from "../../navbar/navigation";
import {Link} from "../../misc/Loader";
import {Banner} from "../../../../../server/serverFunctions/load";

export default function Backdrop({data, index, setPause, current, length, set, stop}: {stop: boolean, length: number, setPause: (a: boolean) => void, set: (start: number, end: number) => void, current: number, data: Banner, index: boolean | null }) {
    const {id, name, backdrop, logo, overview, trailer: link, type} = data
    const overviewRef = useRef<HTMLParagraphElement>(null);
    const holder = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLImageElement>(null);
    const setImage = useSetRecoilState(imageAtom);
    const setParagraph = useSetRecoilState(pGraphAtom);
    const {holderOpacity, imageOpacity} = useRecoilValue(OpacityHomeAtom);
    const {loadTrailer, done, start, destroyTrailer} = useYoutubePLayer(backdropRef, holder, link!);
    const setOpacity = useSetRecoilState(NavOpacityAtom);

    useEffect(() => {
        setOpacity(imageOpacity);
    }, [imageOpacity])

    useEffect(() => {
        destroyTrailer();
        setPause(false);
    }, [current, stop]);

    useEffect(() => {
        if (done && overviewRef.current && holder.current) {
            overviewRef.current.removeAttribute('style');
            holder.current.removeAttribute('style')
            setPause(false);
        }
    }, [done]);

    useEffect(() => {
        if (start && holder.current && backdropRef.current && overviewRef.current) {
            overviewRef.current.style.display = 'none';
            holder.current.style.transform = 'scale(0.8)';
            holder.current.style.height = '25%';
            holder.current.style.margin = '100px 5% 0 0';
            setPause(true);
        }
    }, [start]);

    useEffect(() => {
        setParagraph(overviewRef.current);
        setImage(backdropRef.current);
    }, [])

    const carousel: number[] = [...Array(length).keys()];
    const url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");

    return (
        <div className={index ? style.active : style.slide}>
            <div className={styles.banners}>
                <img
                    className={start ? `${styles.bannersBackdrop} ${styles.fade_img}` : styles.bannersBackdrop}
                    ref={backdropRef} src={backdrop} alt={name} style={{opacity: imageOpacity}}/>
                <div className={styles['bannerObject-holders']}>
                    <div className={styles.bannerHouse} ref={holder} style={{opacity: holderOpacity}}>
                        <img className={styles.bannersLogo} src={logo!} alt={name}/>
                        <div className={styles.bannerButtons}>
                            <PlayButton id={id}/>
                            <TrailerButton id={id} onClick={loadTrailer} trailer={start}/>
                            <Link href={'/info?mediaId=' + id} as={url}>
                                <Template id={2} name={'see details on ' + name} type={'info'}/>
                            </Link>
                        </div>
                        <p ref={overviewRef}>{overview}</p>
                    </div>
                    <nav className={styles.carousel} style={{opacity: holderOpacity}}>
                        {carousel.map((start: number, value: number) => {
                            return (
                                <svg viewBox="0 0 24 24" key={value} onClick={() => set(start, length)}
                                     className={current === start ? styles.activeCarousel : styles.passiveCarousel}>
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}
