import styles from "./Auth.module.css";
import {useSetRecoilState} from "recoil";
import {Authenticated, useReset} from "../../../states/authContext";
import useUser from "../../../utils/userTools";
import {useEffect} from "react";
import {AuthCP} from "../../../SSR";
import Background from "../../production/back";

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
    const {signAsGuest} = useUser();
    const reset = useReset();

    const handleClick = () => {
        reset();
        setAuth(auth.authentication);
    }

    return (
        <>
            <Background response={response} auth={true}/>
            <div id={styles["signIn-button"]} className={styles['signIn-button']} onClick={handleClick}>
                sign in
            </div>

            <Information response={auth}/>
            <div id={styles.guest} className={styles['signIn-button']} onClick={signAsGuest}>continue as guest</div>
        </>
    );
}
