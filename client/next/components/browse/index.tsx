import style from './Style.module.css'
import {BannerHolder} from "./banner";
import {Selectors} from "./selectors";
import {Grid} from "./grid";
import useOnScroll from "../../../utils/opacityScroll";
import {memo, useCallback, useEffect} from 'react';
import {useBrowseContext} from "./browseContext";
import {BrowseData} from "../../../../server/classes/media";
import ErrorBoundary from "../misc/ErrorBoundary";

export const Browse = memo(({data}: { data: BrowseData }) => {
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
        <ErrorBoundary>
            <div className={style.cntr} onScroll={scroll}>
                <BannerHolder banners={data.trending}/>
                <Selectors data={data}/>
                <Grid/>
            </div>
        </ErrorBoundary>
    )
});
