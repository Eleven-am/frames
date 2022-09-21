import styles from "../grid/List.module.css";
import {Loading} from "../misc/Loader";
import GridEntity from "../entities/singleEntity/gridEntity";
import {memo} from "react";

function SearchGrid({loading, grid}: { loading: boolean, grid: any[] }) {
    if (loading || grid.length < 1)
        return <Loading/>

    if (grid && grid.length)
        return (
            <div className={styles.gridHolder}>
                {grid.map((item, v) => <GridEntity key={v} {...item}/>)}
            </div>
        )

    else return null;
}

export default memo(SearchGrid);
