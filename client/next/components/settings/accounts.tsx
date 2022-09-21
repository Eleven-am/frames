import {useFetcher} from "../../../utils/customHooks";
import {Loading} from "../misc/Loader";
import ManageMedia from "./manage/";
import ss from './ACCOUNT.module.css';
import About from "./about";
import Account from "./account";
import {useManageSections} from "../../../utils/modify";
import useUser from "../../../utils/user";
import {memo} from "react";

function Index() {
    const {response, loading: loading2} = useFetcher<string[]>('/api/settings/getSections');
    const {user, loading} = useUser();
    const [select, setSelect] = useManageSections(response, false);

    if (loading || loading2)
        return <Loading/>

    else if (response && user)
        return (
            <>
                <div className={ss.grid}>
                    <ul className={ss.top}>
                        {response.map((e, v) => <li key={v} onClick={() => setSelect(e)}
                                                    className={e === select ? `${ss.li} ${ss.ac}` : ss.li}>
                            {e}
                        </li>)}
                    </ul>
                    <div className={`${ss.li} ${ss.acc}`}>{user.email}</div>
                    {select === 'manage' ? <ManageMedia/> :
                        select === 'about' ? <About/> : <Account/>}
                </div>
            </>
        )

    else return null
}

export default memo(Index);
