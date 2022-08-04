import React from "react";
import GridEntity from "../entities/singleEntity/gridEntity";
import styles from './List.module.css';
import {useRecoilValue} from "recoil";
import {Loading} from "../misc/Loader";
import {GridSelector} from "./gridLibraryContext";
import {SpringMedia} from "../../../../server/classes/media";
import {useInfiniteScroll} from "../../../utils/customHooks";
import {Collection} from "./collectionList";

export default function Grid() {
    const gridSelector = useRecoilValue(GridSelector);
    const {
        loading,
        data,
        handleScroll
    } = useInfiniteScroll<Pick<SpringMedia, 'id' | 'type' | 'backdrop' | 'logo' | 'name'>>(gridSelector ? `/api/load/${gridSelector.type}?${gridSelector.type}=${gridSelector.value}` : '');


    if (loading && !data.length)
        return <Loading/>;

    else if (data && gridSelector?.type !== 'collection')
        return (
            <div className={styles.gridHolder} onScroll={handleScroll}>
                {data.map(item =>
                    <GridEntity key={item.id} {...item} />
                )}
            </div>
        )

    return null;
}

export const CollectionGrid = () => {
    const gridSelector = useRecoilValue(GridSelector);
    const {
        loading,
        data,
        handleScroll
    } = useInfiniteScroll<Pick<SpringMedia, 'id' | 'poster' | 'name'>>(gridSelector ? `/api/load/${gridSelector.type}?${gridSelector.type}=${gridSelector.value}` : '');

    if (loading && !data.length)
        return <Loading/>;

    else if (data && gridSelector?.type === 'collection')
        return (
            <div onScroll={handleScroll} className={styles.gridHolder}>
                {data.map(item =>
                    <Collection key={item.id} {...item} />
                )}
            </div>
        )

    return null;
}