import React, {useEffect, useRef} from "react";
import {PlayButton, Template, TrailerButton} from "../../buttons/Buttons";
import styles from "./BACKDROP.module.css";
import style from "./../Trending.module.css";
import {useYoutubePLayer} from "../../../utils/customHooks";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {CurrentBanner, imageAtom, OpacityHomeAtom, pGraphAtom, TrailerAtom} from "../../../states/homeContext";
import {NavOpacityAtom} from "../../../states/navigation";
import {Banner} from "../../../../server/classes/springboard";
import {FramesLink} from "../../misc/Loader";
import {MediaType} from "@prisma/client";

export default function Backdrop({data, index}: {data: Banner, index: boolean | null}) {
    const {id, name, backdrop, logo, overview, trailer: link, type} = data
    const overviewRef = useRef<HTMLParagraphElement>(null);
    const holder = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLImageElement>(null);
    const setImage = useSetRecoilState(imageAtom);
    const setParagraph = useSetRecoilState(pGraphAtom);
    const {holderOpacity, imageOpacity} = useRecoilValue(OpacityHomeAtom);
    const [trailer, setTrailer] = useRecoilState(TrailerAtom);
    const [current, setCurrent] = useRecoilState(CurrentBanner);
    const {loadTrailer, done, start} = useYoutubePLayer(backdropRef, holder, link!, TrailerAtom);
    const setOpacity = useSetRecoilState(NavOpacityAtom);

    useEffect(() => {
        setOpacity(imageOpacity);
    }, [imageOpacity])

    useEffect(() => {
        setTrailer(false);
    }, [current]);

    useEffect(() => {
        if (done && overviewRef.current && holder.current) {
            overviewRef.current.removeAttribute('style');
            holder.current.removeAttribute('style')
        }
    }, [done]);

    useEffect(() => {
        if (start && holder.current && backdropRef.current && overviewRef.current) {
            overviewRef.current.style.display = 'none';
            holder.current.style.transform = 'scale(0.8)';
            holder.current.style.height = '25%';
            holder.current.style.margin = '100px 5% 0 0';
        }
    }, [start]);

    useEffect(() => {
        setParagraph(overviewRef.current);
        setImage(backdropRef.current);
    }, [])

    const carousel: number[] = [...Array(current.end).keys()];
    const url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");

    return (
        <div className={index ? style.active : style.slide}>
            <div className={styles.banners}>
                <img
                    className={trailer ? `${styles.bannersBackdrop} ${styles.fade_img}` : styles.bannersBackdrop}
                    ref={backdropRef} src={backdrop} alt={name} style={{opacity: imageOpacity}}/>
                <div className={styles['bannerObject-holders']}>
                    <div className={styles.bannerHouse} ref={holder} style={{opacity: holderOpacity}}>
                        <img className={styles.bannersLogo} src={logo!} alt={name}/>
                        <div className={styles.bannerButtons}>
                            <PlayButton id={id}/>
                            <TrailerButton id={id} onClick={loadTrailer} trailer={trailer}/>
                            <FramesLink href={'/info?id=' + id} as={url}>
                                <Template id={2} name={'see details on ' + name}/>
                            </FramesLink>
                        </div>
                        <p ref={overviewRef}>{overview}</p>
                    </div>
                    <nav className={styles.carousel} style={{opacity: holderOpacity}}>
                        {carousel.map((start: number, value: number) => {
                            return (
                                <svg viewBox="0 0 24 24" key={value} onClick={() => setCurrent({...current, start})}
                                     className={current.start === start ? styles.activeCarousel : styles.passiveCarousel}>
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
