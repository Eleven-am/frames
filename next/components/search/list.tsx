import styles from "../grid/List.module.css";
import {useRouter} from "next/router";
import {useRecoilState} from "recoil";
import {SearchContextAtom} from "../../states/navigation";
import {useFetcher} from "../../utils/customHooks";
import {useEffect} from "react";

export default function List() {
    const [searchContext, setSearchContext] = useRecoilState(SearchContextAtom)
    const {response, abort} = useFetcher<{ name: string, type: boolean, id: number }[]>('/api/load/search?node=list&value=' + searchContext);

    const history = useRouter();

    useEffect(() => {
        if (searchContext === '')
            abort.cancel();

        return () => abort.cancel();
    }, [])

    const handleClick = async ({name, type, id}: { name: string, type: boolean, id: number }) => {
        let url = "/" + (type ? "movie" : "show") + "=" + name.replace(/\s/g, "+");
        setSearchContext('');
        await history.push('/info?id=' + id, url);
    };

    if (response && response.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {response.map((item, v) => (
                        <li className={styles.passiveList} key={v}
                            onClick={() => handleClick(item)}>
                            {item.name}
                        </li>
                    ))}
                </ul>
            </div>
        );

    else return null;
}