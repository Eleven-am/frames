import List from "./list";
import SearchGrid from "./grid";
import {useDetectPageChange} from "../../../utils/customHooks";
import {useRecoilState} from "recoil";
import {NavOpacityAtom} from "../navbar/navigation";
import {memo, useEffect, useRef} from "react";
import {Loading} from "../misc/Loader";
import {useSearch} from "../navbar/navbar";

function SearchLayout() {
    const {loading: pageChange} = useDetectPageChange();
    const opacityBackup = useRef(0);
    const [opacity, setOpacity] = useRecoilState(NavOpacityAtom)
    const {list, grid, loading, setSearch, active} = useSearch();

    useEffect(() => {
        opacityBackup.current = opacity;
        setOpacity(-1);
        return () => {
            setOpacity(opacityBackup.current);
            setSearch('');
        }
    }, []);

    if (pageChange)
        return <Loading/>

    else if (active)
        return (
            <>
                <List list={list}/>
                <SearchGrid grid={grid} loading={loading}/>
            </>
        )

    else return null
}

export default memo(SearchLayout)

