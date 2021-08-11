import { useRouter } from 'next/router'
import styles from "./List.module.css";
import {useFetcher, useNavBar} from "../../utils/customHooks";
import {useRecoilState} from "recoil";
import {GridSelector, useGridReset} from "../../states/gridLibraryContext";
import {useEffect} from "react";
import NProgress from "nprogress";

export default function SearchList() {
    const router = useRouter();
    const type = router.asPath.includes('genre') ? 'genres': 'decades';
    const [gridInfo, setGridInfo] = useRecoilState(GridSelector);
    const reset = useGridReset();
    const {response, error} = useFetcher<string[]>('/api/load/grid?value=' + type);
    useNavBar(type, -1);

    useEffect(() => {
        NProgress.done();
        response?.length && setGridInfo({type, value: response[0]})

        return () => reset();
    }, [response])

    if (error)
        console.log(error);

    else if (response && response.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {response.map((value, v) => (
                        <li className={gridInfo?.value === value ? styles.activeList : styles.passiveList} key={v}
                            onClick={() => setGridInfo({type, value})}>
                            {value}
                        </li>
                    ))}
                </ul>
            </div>
        );

    return null;
}