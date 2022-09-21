import styles from "../grid/List.module.css";
import {useRouter} from "next/router";
import {MediaType} from "@prisma/client";
import {memo, useCallback} from "react";

function List({list}: { list: { name: string, type: MediaType, id: number }[] }) {
    const history = useRouter();

    const handleClick = useCallback(async ({name, type, id}: { name: string, type: MediaType, id: number }) => {
        let url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");
        await history.push('/info?mediaId=' + id, url);
    }, [history]);

    if (list && list.length)
        return (
            <div className={styles.searchListHolder}>
                <ul className={styles.searchList}>
                    {list.map((item, v) => (
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

export default memo(List)

