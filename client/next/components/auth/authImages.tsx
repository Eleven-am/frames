import styles from "./Auth.module.css";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {AuthContextHandler, AuthContextProcessAtom, Authenticated, useReset} from "./authContext";
import useUser from "../../../utils/userTools";
import {useEffect} from "react";
import Background from "../production/back";
import {AuthCP} from "../../../../server/classes/middleware";

function Information({response}: { response: AuthCP }) {
    const setAuth = useSetRecoilState(Authenticated);

    useEffect(() => {
        setAuth(response.authentication);
    }, [response])

    return (
        <div style={{
            position: "fixed",
            bottom: "4vh",
            color: "white",
            width: "100%",
            textAlign: "center",
            fontFamily: "'Roboto', sans-serif",
        }}>
            <span>{response.cpRight}</span>
            <div style={{lineHeight: "10px"}}>
                <span style={{fontSize: "x-small"}}>{response.aReserved}</span>
                <br/>
                <span style={{fontSize: "x-small"}}>
                    Videos only stream till the 5 minute mark for guest
                </span>
            </div>
        </div>
    )
}

export default function AuthImages({response, auth}: { response: string[], auth: AuthCP }) {
    const setAuth = useSetRecoilState(Authenticated);
    const process = useRecoilValue(AuthContextProcessAtom);
    const dispatch = useSetRecoilState(AuthContextHandler);

    const {signAsGuest} = useUser();
    const reset = useReset();

    const handleClick = () => {
        reset();
        setAuth(auth.authentication);
    }

    const handleGuest = async () => {
        dispatch({fade: true});
        dispatch({error: await signAsGuest()});
    }

    return (
        <>
            <Background response={response} auth={true}/>
            {process !== 'pick' ?
                <div id={styles["signIn-button"]} className={styles['signIn-button']} onClick={handleClick}>
                    select a provider
                </div> : null }

            <Information response={auth}/>
            <div id={styles.guest} className={styles['signIn-button']} onClick={handleGuest}>continue as guest</div>
        </>
    );
}
