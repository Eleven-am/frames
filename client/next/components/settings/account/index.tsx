import ss from "../ACCOUNT.module.css";
import {useManageSections} from "../../../../utils/modify";
import WatchHistory from "./watchHistory";
import YourList from "./myList";
import {memo} from "react";

function Account() {
    const response = ['watch history', 'notifications', 'playlists', 'your list', 'playback settings', 'security settings'];
    const [side, setSide] = useManageSections(response);

    return (
        <div className={ss.display}>
            <ul className={ss.side}>
                {response?.map((e, v) => <li key={v} onClick={() => setSide(e)}
                                             className={e === side ? `${ss.li} ${ss.ac}` : ss.li}>
                    {e}
                </li>)}
            </ul>
            <div className={ss.infH}>
                {side === 'watch history' && <WatchHistory/>}
                {side === 'notifications' && <div>notifications</div>}
                {side === 'your list' && <YourList/>}
            </div>
        </div>
    )
}

export default memo(Account);
