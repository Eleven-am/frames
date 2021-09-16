import {useSetRecoilState} from "recoil";
import {GridOnScreenAtom, GridSelector, useGridReset} from "../../states/gridLibraryContext";
import {useFetcher, useNavBar, useOnScreen} from "../../utils/customHooks";
import {CollectionFace} from "../../../server/classes/media";
import React, {useEffect} from "react";
import NProgress from "nprogress";
import styles from "./List.module.css";
import ss from "../entities/singleEntity/Grid.module.css";
import {FramesLink as Link} from "../misc/Loader";

export function Collection({item, beacon}: { beacon: boolean, item: CollectionFace }) {
    const setOnScreen = useSetRecoilState(GridOnScreenAtom);
    const [isVisible, setIsVisible] = useOnScreen<HTMLDivElement>(beacon, '1000px');
    useEffect(() => setOnScreen(isVisible), [isVisible]);

    return (
        <Link href={'collection='+item.collectionId}>
            <div className={ss.collectionHolder} ref={setIsVisible}>
                <div className={ss.collectionImgHolder}>
                    <img className={ss.collectionImg} src={item.collectionPoster} alt={item.collectionName}/>
                </div>
                <div className={ss.gridName}>{item.collectionName}</div>
            </div>
        </Link>

    )
}

export default function CollectionList() {
    const setGridInfo = useSetRecoilState(GridSelector);
    const reset = useGridReset();

    const {
        response,
        error
    } = useFetcher<CollectionFace[]>('/api/load/collection?page=default');
    useNavBar('collections', -1);

    useEffect(() => {
        NProgress.done();
        setGridInfo({type: 'collection', value: 'collection'})

        return () => reset();
    }, [])

    if (error)
        console.log(error);

    else if (response && response.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {response.map((item, v) => (
                        <Link href={'collection='+item.collectionId} key={v}>
                            <li className={styles.passiveList}>
                                {item.collectionName}
                            </li>
                        </Link>
                    ))}
                </ul>
            </div>
        );

    return null;
}