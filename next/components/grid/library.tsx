import {MediaType} from '@prisma/client';
import {FramesLink as Link} from "../misc/Loader";
import {useRouter} from 'next/router';
import styles from "./List.module.css";
import {useFetcher, useNavBar} from "../../utils/customHooks";
import {useSetRecoilState} from "recoil";
import {GridSelector, useGridReset} from "../../states/gridLibraryContext";
import {useEffect} from "react";
import NProgress from "nprogress";

export default function LibraryList() {
    const router = useRouter();
    const type = router.asPath.includes('movies') ? 'movies' : 'tv shows';
    const unit = router.asPath.includes('movies') ? 'movies' : 'shows';
    const reset = useGridReset();
    const setGridInfo = useSetRecoilState(GridSelector);

    const {
        response,
        error
    } = useFetcher<{ name: string, type: MediaType, id: number }[]>('/api/load/library?value=' + type);
    useNavBar(type, -1);

    useEffect(() => {
        NProgress.done();
        response && setGridInfo({type: 'lib', value: unit})

        return () => reset();
    }, [response])

    if (error)
        console.log(error);

    else if (response && response.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {response.map((item, v) => (
                        <Link key={v} href={'/info?id=' + item.id}
                              as={"/" + (item.type ? "movie" : "show") + "=" + item.name.replace(/\s/g, "+")}>
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