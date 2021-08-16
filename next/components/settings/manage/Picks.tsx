import ss from "../ACCOUNT.module.css";
import {useFetcher} from "../../../utils/customHooks";
import {PicksList} from "../../../../server/classes/listEditors";
import {Loading} from "../../misc/Loader";
import {Template} from "../../buttons/Buttons";
import {useSetRecoilState} from "recoil";
import {EditPickContext} from "../../../utils/editPicks";

function Pick({obj}: {obj: PicksList}) {
    const dispatch = useSetRecoilState(EditPickContext);

    return (
        <div className={ss.res} onClick={() => dispatch({modify: obj})}>
            <img src={obj.poster} alt={obj.display} className={ss.resImage}/>
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.display}</span>
                </div>
                <p className="overview">{obj.overview}</p>
            </div>
        </div>
    )
}

export default function Picks() {
    const {response, loading, error} = useFetcher<PicksList[]>('/api/update/getPicks');
    const dispatch = useSetRecoilState(EditPickContext);

    if (loading || error)
        return <Loading/>;

    else if (response)
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <Template id={1} type={'add'} name={`add new editor's pick`} onClick={() => dispatch({})}/>
                </div>

                {response.map((e, v) => <Pick obj={e} key={v}/>)}
            </div>
        )

    else return null;
}