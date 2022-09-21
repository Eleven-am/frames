import React, {memo, useCallback, useEffect, useRef, useState} from "react";
import info from "./Info.module.css";
import styles from '../trending/backdrop/BACKDROP.module.css'
import InfoSections from "./sections/sections";
import InfoDetails from "./details/infoDetails";
import {FramesButton} from "../buttons/Buttons";
import {useYoutubePLayer} from "../../../utils/customHooks";
import useOnScroll from "../../../utils/opacityScroll";
import {useRecoilValue} from "recoil";
import {InfoContext} from "./infoContext";
import {useRouter} from "next/router";
import {MediaType} from "@prisma/client";
import {useDecadeContext, useGenreContext} from "../browse/browseContext";

function Info() {
    const response = useRecoilValue(InfoContext);
    const backdropRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const {start, loadTrailer, done} = useYoutubePLayer();
    const {onScroll, values, setReference, reset} = useOnScroll();
    const [move, setMove] = useState(false);
    const {splitGenres} = useGenreContext();
    const {manageDecade} = useDecadeContext();
    const router = useRouter();

    const handleGenreClick = useCallback(async () => {
        if (response) {
            splitGenres(response.genre);
            const url = response.type === MediaType.MOVIE ? '/movies' : '/shows';
            await router.push(url);
        }
    }, [response, router, splitGenres]);

    const handleDecade = useCallback(async () => {
        if (response) {
            const year = response.release.match(/\d{4}$/);
            if (year) {
                const decade = year[0].replace(/\d$/, '0s');
                const url = response.type === MediaType.MOVIE ? '/movies' : '/shows';
                manageDecade(decade);
                await router.push(url);
            }
        }
    }, [response, router, manageDecade]);

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

    const handleClick = useCallback(() => loadTrailer(response?.trailer || '', imgRef.current!), [response, loadTrailer]);

    if (!response) return null;

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
                            <FramesButton type='primary' icon='play' tooltip={`play ${response.name}`} label='play'
                                          link={{href: '/watch?mediaId=' + response.id}}/>
                            <FramesButton type='secondary' icon='roll' label={start ? 'stop' : 'trailer'}
                                          tooltip={start ? 'stop trailer' : 'trailer'} onClick={handleClick}/>
                        </div>
                    </div>
                    : <>
                        <InfoDetails
                            loadTrailer={handleClick}
                            trailer={start}
                            splitGenres={handleGenreClick}
                            manageDecade={handleDecade}
                        />
                        <InfoSections
                            setReference={setReference}
                            manageDecade={handleDecade}
                            splitGenres={handleGenreClick}
                        />
                    </>
                }
            </div>
        </div>
    );
}

export default memo(Info);
