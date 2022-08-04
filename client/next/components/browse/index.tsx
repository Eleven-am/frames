import style from './Style.module.css'
import BannerHolder from "./banner";
import Selectors from "./selectors";
import Grid from "./grid";
import useOnScroll from "../../../utils/opacityScroll";
import {useCallback, useEffect} from 'react';
import {useBrowseContext} from "./browseContext";
import {BrowseData} from "../../../../server/classes/media";

export default function Browse({data}: { data: BrowseData }) {
    const {onScroll} = useOnScroll();
    const {handleScroll, reset} = useBrowseContext(true);

    const scroll = useCallback(async (event: any) => {
        await handleScroll(event);
        onScroll();
    }, [handleScroll, onScroll]);

    useEffect(() => {
        return () => reset();
    }, []);

    return (
        <div className={style.cntr} onScroll={scroll}>
            <BannerHolder banners={data.trending}/>
            <Selectors data={data}/>
            <Grid/>
        </div>
    )
}
