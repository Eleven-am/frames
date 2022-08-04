import React, {useCallback, useEffect, useState} from "react";
import {Loading} from "../../misc/Loader";
import ss from "../ACCOUNT.module.css";
import {FramesButton} from "../../buttons/Buttons";
import {useClipboard} from "../../../../utils/customHooks";
import {SearchRes} from "./library";
import useNotifications, {useConfirmDispatch} from "../../../../utils/notifications";
import useUser from "../../../../utils/user";
import {ManageAuthKey} from "../../../../../server/classes/auth";

export default function ManageKeys() {
    const {manageKeys, generateAuthKey} = useUser();
    const {globalNotification: channel} = useNotifications();
    const [state, setState] = useState<ManageAuthKey[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useConfirmDispatch();
    const {copy: cp} = useClipboard();

    channel.subscribe<{ event: string, authKey: string, email: string }>('shout', msg => {
        switch (msg.event) {
            case 'exhaustedKey':
                const username = msg.email.split('@')[0];
                dispatch({
                    type: 'warn',
                    heading: 'Key Exhausted',
                    message: `${username}'s just used the ${msg.authKey} key.`,
                })
                loadKeys();
                break;
        }
    })

    const copy = useCallback(async (obj: { key: string, access: number }) => {
        if (obj.access === 0)
            await cp(obj.key, 'Successfully copied the auth key');

        else dispatch({
            type: "warn",
            heading: 'Invalid action',
            message: 'This auth key has been exhausted'
        })
    }, [cp, dispatch]);

    const loadKeys = useCallback(() => {
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
    }, [manageKeys, dispatch]);

    const handleClick = useCallback(async () => {
        const response = await generateAuthKey();
        dispatch({
            type: response.authKey ? 'success' : 'error',
            heading: response.authKey ? 'Auth key generated' : 'Something went wrong',
            message: response.authKey || response.error || ''
        })

        if (response.authKey)
            loadKeys();
    }, [generateAuthKey, loadKeys, dispatch])

    useEffect(() => {
        loadKeys();
    }, [])

    if (loading)
        return <Loading/>

    else
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <FramesButton type='secondary' icon={'add'} label='generate auth key' onClick={handleClick}/>
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