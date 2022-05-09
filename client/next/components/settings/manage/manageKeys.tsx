import React, {useEffect, useState} from "react";
import {Loading} from "../../misc/Loader";
import ss from "../ACCOUNT.module.css";
import {Template} from "../../buttons/Buttons";
import {useInfoDispatch} from "../../misc/inform";
import useUser from "../../../../utils/userTools";
import {ManageAuthKey} from "../../../../../server/classes/auth";
import {useClipboard} from "../../../../utils/customHooks";
import {SearchRes} from "./library";

export default function ManageKeys() {
    const {manageKeys, generateAuthKey} = useUser();
    const [state, setState] = useState<ManageAuthKey[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useInfoDispatch();
    const {copy: cp} = useClipboard();

    const copy = async (obj: { key: string, access: number }) => {
        if (obj.access === 0)
            await cp(obj.key, 'Successfully copied the auth key');

        else dispatch({
            type: "warn",
            heading: 'Invalid action',
            message: 'This auth key has been exhausted'
        })
    }

    const loadKeys = () => {
        manageKeys()
            .then(response => {
                if (response.response)
                    setState(response.response);

                else if (response.error)
                    dispatch({
                        type: "error",
                        heading: 'Something went wrong',
                        message: response.error
                    })

                setLoading(false);
            })
    }

    const handleClick = async () => {
        const response = await generateAuthKey();
        dispatch({
            type: response.authKey ? 'alert' : 'error',
            heading: response.authKey ? 'Auth key generated' : 'Something went wrong',
            message: response.authKey || response.error || ''
        })

        if (response.authKey)
            loadKeys();
    }

    useEffect(() => {
        loadKeys();
    }, [])

    if (loading)
        return <Loading/>

    else
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <Template id={1} type={'add'} name={`generate auth key`} onClick={handleClick}/>
                </div>

                {state.map((e, v) => {
                    const obj = {
                        id: {key: e.key, access: e.access},
                        name: e.name, overview: e.description,
                        backdrop: e.backdrop,
                        onClick: copy
                    }
                    return <SearchRes key={v} {...obj}/>
                })}
            </div>
        )
}