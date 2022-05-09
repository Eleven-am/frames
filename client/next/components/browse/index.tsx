import style from './Style.module.css'
import BannerHolder from "./banner";
import Selectors from "./selectors";
import Grid from "./grid";
import useOnScroll from "../../../utils/opacityScroll";
import React from 'react';
import {useBrowseContext} from "./browseContext";
import {Banner} from "../../../../server/serverFunctions/load";

export default function Browse({banner}: { banner: Banner[] }) {
    const {onScroll} = useOnScroll();
    const {handleScroll, reset} = useBrowseContext(true);

    const scroll = async (event: any) => {
        await handleScroll(event);
        onScroll();
    }

    React.useEffect(() => {
        return () => {
            reset();
        }
    }, []);

    return (
        <div className={style.cntr} onScroll={scroll}>
            <BannerHolder banners={banner} />
            <Selectors />
            <Grid />
        </div>
    )
}