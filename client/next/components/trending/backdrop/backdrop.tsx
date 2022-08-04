import React, {useCallback, useEffect, useMemo, useRef} from "react";
import {FramesButton} from "../../buttons/Buttons";
import styles from "./BACKDROP.module.css";
import style from "./../Trending.module.css";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {MediaType} from "@prisma/client";
import {imageAtom, OpacityHomeAtom, pGraphAtom} from "../../homeSection/homeContext";
import {NavOpacityAtom} from "../../navbar/navigation";
import {Banner} from "../../../../../server/classes/media";

interface TrendingBlock {
    data: Banner,
    index: boolean | null
    start: boolean
    done: boolean
    loadTrailer: (a: string, b: HTMLImageElement) => void
}

export default function Backdrop({data, index, start, done, loadTrailer}: TrendingBlock) {
    const {id, name, backdrop, logo, overview, trailer: link, type} = data
    const overviewRef = useRef<HTMLParagraphElement>(null);
    const holder = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLImageElement>(null);
    const setImage = useSetRecoilState(imageAtom);
    const setParagraph = useSetRecoilState(pGraphAtom);
    const {holderOpacity, imageOpacity} = useRecoilValue(OpacityHomeAtom);
    const setOpacity = useSetRecoilState(NavOpacityAtom);

    const handleClick = useCallback(() => loadTrailer(link, backdropRef.current!), [link, backdropRef, loadTrailer]);

    useEffect(() => setOpacity(imageOpacity), [imageOpacity])

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

    const url = useMemo(() => "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+"), [name, type]);

    return (<div className={index ? style.active : style.slide}>
        <div className={styles.banners}>
            <img
                className={start ? `${styles.bannersBackdrop} ${styles.fade_img}` : styles.bannersBackdrop}
                ref={backdropRef} src={backdrop} alt={name} style={{opacity: imageOpacity}}/>
            <div className={styles['bannerObject-holders']}>
                <div className={styles.bannerHouse} ref={holder} style={{opacity: holderOpacity}}>
                    <img className={styles.bannersLogo} src={logo!} alt={name}/>
                    <div className={styles.bannerButtons}>
                        <FramesButton type='primary' icon='play' tooltip={`play ${name}`} label='play'
                                      link={{href: '/watch?mediaId=' + id}}/>
                        <FramesButton type='secondary' icon='roll' label={start ? 'stop' : 'trailer'}
                                      tooltip={start ? 'stop trailer' : 'trailer'} onClick={handleClick}/>
                        <FramesButton type='round' tooltip={'see details on ' + name} icon={'info'}
                                      link={{as: url, href: '/info?mediaId=' + id}}/>
                    </div>
                    <p ref={overviewRef}>{overview}</p>
                </div>
            </div>
        </div>
    </div>)
}
