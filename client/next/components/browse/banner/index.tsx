import ss from "./Banner.module.css";
import React, {useCallback, useMemo, useState} from "react";
import {useInterval} from "../../../../utils/customHooks";
import styles from "../../trending/backdrop/BACKDROP.module.css";
import {Link} from "../../misc/Loader";
import {MediaType} from "@prisma/client";
import {Banner} from "../../../../../server/classes/media";

function BannerObj({banner, style}: { banner: Banner, style: 'active' | 'left' | 'right' | 'other' }) {
    const url = "/" + (banner.type === MediaType.MOVIE ? "movie" : "show") + "=" + banner.name.replace(/\s/g, "+");

    if (style === 'other')
        return null;

    return (
        <div className={`${ss.hldr} ${style === "active" ? ss.second : style === "left" ? ss.first : ss.third}`}>
            <Link href={'/info?mediaId=' + banner.id} as={url}>
                <img className={ss.bck} src={banner.backdrop} alt={banner.name}/>
                <div className={ss.foncer}/>
                {style === "active" && <img className={ss.logo} src={banner.logo} alt={banner.name}/>}
            </Link>
        </div>
    )
}

export default function BannerHolder({banners}: { banners: Banner[] }) {
    const [first, setFirst] = useState(0);
    const [second, setSecond] = useState(1);
    const [third, setThird] = useState(2);

    const {restart} = useInterval(() => {
        setFirst(p => p + 1 > banners.length - 1 ? 0 : p + 1);
        setSecond(p => p + 1 > banners.length - 1 ? 0 : p + 1);
        setThird(p => p + 1 > banners.length - 1 ? 0 : p + 1);
    }, 20, false)

    const setActive = useCallback((index: number) => {
        setFirst(index);
        setSecond(index + 1 > banners.length - 1 ? 0 : index + 1);
        setThird(index + 1 > banners.length - 1 ? 1 : index + 2 > banners.length - 1 ? 0 : index + 2);
        restart();
    }, [restart, banners]);

    const carousel = useMemo(() => [...Array(banners.length).keys()], [banners]);

    return (
        <div className={ss.CNTR}>
            {banners.map((b, i) => {
                if (i === first)
                    return <BannerObj key={b.id} banner={b} style={'left'}/>
                else if (i === second)
                    return <BannerObj key={b.id} banner={b} style={'active'}/>
                else if (i === third)
                    return <BannerObj key={b.id} banner={b} style={'right'}/>
                else
                    return null;
            })}

            {third === 0 && <BannerObj banner={banners[0]} style={'right'}/>}

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
}
