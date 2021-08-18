import useUser from "../../../utils/userTools";
import React, {useEffect, useState} from "react";
import {ManageAuthKey} from "../../../../server/classes/auth";
import {Loading} from "../../misc/Loader";
import ss from "../ACCOUNT.module.css";
import {Template} from "../../buttons/Buttons";
import {UseCase} from '@prisma/client';
import {useSetRecoilState} from "recoil";
import {InformDisplayContext} from "../../misc/inform";

function KeyHolder({obj}: { obj: ManageAuthKey }) {
    return (
        <div className={`${ss.res} ${ss.had}`}>
            <img src={obj.backdrop} alt={obj.name}
                 className={obj.case === UseCase.SIGNUP ? ss.resPerson : ss.resImage}/>
            <div className={ss.resDiv}>
                <div className={ss.resSpan}>
                    <span>{obj.name}</span>
                </div>
                <p className="overview">{obj.description}</p>
            </div>
        </div>
    )
}

export default function ManageKeys() {
    const {manageKeys, generateAuthKey} = useUser();
    const [state, setState] = useState<ManageAuthKey[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useSetRecoilState(InformDisplayContext);

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

    else if (state.length)
        return (
            <div className={ss.data}>
                <div className={ss.searchContainer}>
                    <Template id={1} type={'add'} name={`generate auth key`} onClick={handleClick}/>
                </div>

                {state.map((e, v) => <KeyHolder obj={e} key={v}/>)}
            </div>
        )

    return null;
}