import {useFetcher} from "../../../../utils/customHooks";
import ss from "../ACCOUNT.module.css";
import Library from "./library";
import ManageKeys from "./manageKeys";
import Picks from "./picks";
import GetContents from "./getContents";
import {useManageSections} from "../../../../utils/modify";
import {memo} from "react";

function Manage() {
    const {response} = useFetcher<string[]>('/api/settings/getManage');
    const [side, setSide] = useManageSections(response);

    return (<div className={ss.display}>
        <ul className={ss.side}>
            {response?.map((e, v) => <li key={v} onClick={() => setSide(e)}
                                         className={e === side ? `${ss.li} ${ss.ac}` : ss.li}>
                {e}
            </li>)}
        </ul>
        <div className={ss.infH}>
            {side === 'library' ? <Library/> : side === 'manage keys' ? <ManageKeys/> : side === 'manage picks' ?
                <Picks/> : side === 'get contents' ? <GetContents/> : null}
        </div>
    </div>)
}

export default memo(Manage);
