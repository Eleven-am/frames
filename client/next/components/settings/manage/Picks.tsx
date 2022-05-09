import ss from "../ACCOUNT.module.css";
import {Loading} from "../../misc/Loader";
import {Template} from "../../buttons/Buttons";
import {PickSummary} from "../../../../../server/classes/listEditors";
import {useLongPolling} from "../../../../utils/customHooks";
import {useEditorPicks} from "../../../../utils/modify";
import {Settings, SearchRes} from "./library";

export default function Picks() {
    const {pushPickLib} = useEditorPicks();
    const {loading, state: response} = useLongPolling<PickSummary[]>('/api/settings/getPicks', null);

    if (loading && !response) return <Loading/>

    else if (response)
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <Template id={1} type={'add'} name={`add new editor's pick`} onClick={() => pushPickLib(null)}/>
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