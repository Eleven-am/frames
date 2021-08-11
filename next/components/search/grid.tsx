import styles from "../grid/List.module.css";
import GridEntity from "../entities/singleEntity/gridEntity";
import {useRecoilState} from "recoil";
import {SearchContextAtom} from "../../states/navigation";
import {useFetcher} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import {useEffect} from "react";
import {search} from "../../../server/classes/springboard";

export default function SearchGrid() {
    const [searchContext, setState] = useRecoilState(SearchContextAtom);
    const {response, loading, abort} = useFetcher<search[]>('/api/load/search?node=grid&value=' + searchContext);

    useEffect(() => {
        if (searchContext === '')
            abort.cancel();

        return () => abort.cancel();
    }, [])

    if (loading || response && response.length < 1)
        return <Loading/>

    if (response && response.length) {
        return (
            <div className={styles.gridHolder} onClick={() => setState('')}>
                {response.map((item, v) => <GridEntity key={v} {...item}/>)}
            </div>
        )
    } else return null;
}