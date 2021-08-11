import React, {useEffect, useState} from "react";
import NProgress from "nprogress";
import ss from './ACCOUNT.module.css';
import useUser from "../../utils/userTools";
import {useFetcher, useNavBar} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import ManageMedia from "./manage/manage";

export default function Account() {
    const {response: data, loading: loading2} = useFetcher<string[]>('/api/update/getSections');
    const {user: response, loading} = useUser();
    const [select, setSelect] = useState('');
    useNavBar('admin', 1)

    useEffect(() => {
        NProgress.done();
    }, [])

    useEffect(() => {
        data && data.length && setSelect(data[0]);
    }, [data])

    if (loading || loading2)
        return <Loading/>

    else if (response && data)
        return (
            <>
                <div className={ss.grid}>
                    <ul className={ss.top}>
                        {data.map((e, v) => <li key={v} onClick={() => setSelect(e)}
                                                className={e === select ? `${ss.li} ${ss.ac}`: ss.li}>
                            {e}
                        </li>)}
                    </ul>
                    <div className={`${ss.li} ${ss.acc}`}>{response.email}</div>
                    {select === 'manage' ? <ManageMedia/>: null}
                </div>
            </>
        )

    else return null;
}
