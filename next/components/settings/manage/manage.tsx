import ss from "../ACCOUNT.module.css";
import GetContents from "./getContents";
import Library from "./library";
import React, {useEffect, useState} from "react";
import {useFetcher} from "../../../utils/customHooks";

export default function Manage() {
    const {response: array} = useFetcher<string[]>('/api/update/getManage');
    const [side, setSide] = useState('');

    useEffect(() => {
        array && array.length && setSide(array[0]);
    }, [array])

    return (
        <div className={ss.display}>
            <ul className={ss.side}>
                {array?.map((e, v) =>  <li key={v} onClick={() => setSide(e)} className={e === side ? `${ss.li} ${ss.ac}`: ss.li}>
                    {e}
                </li>)}
            </ul>
            {side === 'get contents' ? <GetContents/>:
                side === 'library'? <Library/>: null}
        </div>
    )
}