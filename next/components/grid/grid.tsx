import React from "react";
import GridEntity from "../entities/singleEntity/gridEntity";
import styles from './List.module.css';
import {useRecoilValue} from "recoil";
import {GridSelector} from "../../states/gridLibraryContext";
import {useInfiniteScroll} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import {MediaSection} from "../../../server/classes/media";

export interface MediaLibrary extends MediaSection {
    beacon?: boolean,
}

export default function Grid() {
    const gridInfo = useRecoilValue(GridSelector);
    const {data} = useInfiniteScroll<MediaLibrary>(gridInfo?.type.replace(/s$/, '') || '', gridInfo?.value || '');

    if (data)
        return (
            <div className={styles.gridHolder}>
                {data.map((item, v) =>
                    <GridEntity key={v} {...item} beacon={v === data.length - 1}/>
                )}
            </div>
        )

    else return <Loading/>;
}


