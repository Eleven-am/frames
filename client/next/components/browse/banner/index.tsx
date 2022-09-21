import ss from "./Banner.module.css";
import React, {memo, useCallback, useMemo, useState} from "react";
import {useInterval} from "../../../../utils/customHooks";
import styles from "../../trending/backdrop/BACKDROP.module.css";
import {Link} from "../../misc/Loader";
import {MediaType} from "@prisma/client";
import {Banner} from "../../../../../server/classes/media";

const BannerObj = memo(({banner, style, direction}: { banner: Banner, style: 'active' | 'left' | 'right' | 'other', direction: 'forward' | 'backward' }) => {
    const url = "/" + (banner.type === MediaType.MOVIE ? "movie" : "show") + "=" + banner.name.replace(/\s/g, "+");

    if (style === 'other')
        return null;

    const className = useMemo(() => {
        let className;
        switch (style) {
            case 'active':
                className = direction === 'forward' ? ss.second : ss.secondBack;
                break;
            case 'left':
                className = direction === 'forward' ? ss.first : ss.firstBack;
                break;
            case 'right':
                className = direction === 'forward' ? ss.third : ss.thirdBack;
                break;
        }
        return `${ss.hldr} ${className}`;
    }, [style, direction]);

    return (
        <div className={className}>
            <Link href={'/info?mediaId=' + banner.id} as={url}>
                <img className={ss.bck} src={banner.backdrop} alt={banner.name}/>
                <div className={ss.foncer}/>
                {style === "active" && <img className={ss.logo} src={banner.logo} alt={banner.name}/>}
            </Link>
        </div>
    )
});

export const BannerHolder = memo(({banners}: { banners: Banner[] }) => {
    const [first, setFirst] = useState(0);
    const [second, setSecond] = useState(1);
    const [third, setThird] = useState(2);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

    const {restart} = useInterval(() => {
        setDirection('forward');
        setFirst(p => p + 1 > banners.length - 1 ? 0 : p + 1);
        setSecond(p => p + 1 > banners.length - 1 ? 0 : p + 1);
        setThird(p => p + 1 > banners.length - 1 ? 0 : p + 1);
    }, 20, false)

    const generateDirection = useCallback((index: number) => {
        const last = banners.length - 1;
        if (index === 0 && first === last)
            return 'forward';

        if (first === 0 && index === last)
            return 'backward';

        return index > first ? 'forward' : 'backward';
    } , [first, banners.length]);

    const setActive = useCallback((index: number) => {
        setDirection(generateDirection(index));
        setFirst(index);
        setSecond(index + 1 > banners.length - 1 ? 0 : index + 1);
        setThird(index + 1 > banners.length - 1 ? 1 : index + 2 > banners.length - 1 ? 0 : index + 2);
        restart();
    }, [restart, banners.length, generateDirection]);

    const carousel = useMemo(() => [...Array(banners.length).keys()], [banners]);

    return (
        <div className={ss.CNTR}>
            {banners.map((b, i) => {
                if (i === first)
                    return <BannerObj key={b.id} banner={b} direction={direction} style={'left'}/>
                else if (i === second)
                    return <BannerObj key={b.id} banner={b} direction={direction} style={'active'}/>
                else if (i === third)
                    return <BannerObj key={b.id} banner={b} direction={direction} style={'right'}/>
                else
                    return null;
            })}

            <div className={ss.nav}>
                {carousel.map((start: number, value: number) => {
                    return (
                        <svg viewBox="0 0 24 24" key={value} onClick={() => setActive(start)}
                             className={first === start ? styles.activeCarousel : styles.passiveCarousel}>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    )
                })}
            </div>
        </div>
    )
});
