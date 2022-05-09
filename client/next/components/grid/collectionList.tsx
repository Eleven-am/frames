import {useSetRecoilState} from "recoil";
import React, {useEffect} from "react";
import NProgress from "nprogress";
import styles from "./List.module.css";
import ss from "../entities/singleEntity/Grid.module.css";
import {Link} from "../misc/Loader";
import {GridSelector, useGridReset} from "./gridLibraryContext";
import {useFetcher, useNavBar} from "../../../utils/customHooks";
import {FramesCollections} from "../../../../server/classes/media";
import frames from "../../assets/frames.png";
import Image from "next/image";

export function Collection(item: Pick<FramesCollections, "id" | "name" | "poster">) {
    return (
        <Link href={'collection?collectionId='+item.id} as={'collection=' + item.name.replace(/\s/g, '+')}>
            <div className={ss.collectionHolder}>
                <div className={ss.collectionImgHolder}>
                    {item.poster ? <img className={ss.collectionImg} src={item.poster} alt={item.name}/>:
                    <div className={ss.collectionImg}>
                        <div className={ss.collectionImgDiv}>
                            <Image src={frames} objectFit={'contain'} objectPosition={'center'}/>
                        </div>
                    </div>
                    }
                </div>
                <div className={ss.gridName}>{item.name}</div>
            </div>
        </Link>

    )
}

export default function CollectionList() {
    const setGridInfo = useSetRecoilState(GridSelector);
    const reset = useGridReset();

    const {
        response,
    } = useFetcher<Pick<FramesCollections, 'id' | 'name' | 'poster'>[]>('/api/load/collections');
    useNavBar('collections', -1);

    useEffect(() => {
        NProgress.done();
        setGridInfo({type: 'collection', value: 'collection'})

        return () => reset();
    }, [])

    if (response && response.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {response.map(item => (
                        <Link href={'collection?collectionId='+item.id} key={item.id} as={'collection=' + item.name.replace(/\s/g, '+')}>
                            <li className={styles.passiveList}>
                                {item.name}
                            </li>
                        </Link>
                    ))}
                </ul>
            </div>
        );

    return null;
}