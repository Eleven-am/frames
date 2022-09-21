import ss from "../ACCOUNT.module.css";
import {Loading} from "../../misc/Loader";
import {FramesButton} from "../../buttons/Buttons";
import {useEditorPicks} from "../../../../utils/modify";
import {SearchRes, Settings} from "./library";
import {PickSummary} from "../../../../../server/classes/pickAndFrame";
import {useFetcher} from "../../../../utils/customHooks";
import {memo} from "react";

function Picks() {
    const {pushPickLib} = useEditorPicks();
    const {loading, response} = useFetcher<PickSummary[]>('/api/settings/getPicks');

    if (loading && !response) return <Loading/>

    else if (response)
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <FramesButton type='secondary' icon='add' label="add new editor's pick" state={null} onClick={pushPickLib}/>
                </div>

                {response.map((e, v) => {
                    const obj: Settings<PickSummary> = {
                        name: e.display,
                        backdrop: e.poster,
                        overview: e.overview,
                        id: e,
                        onClick: pushPickLib
                    }

                    return <SearchRes key={v} {...obj}/>
                })}
            </div>
        )

    else return null;
}

export default memo(Picks);
