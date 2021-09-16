import styles from "./Auth.module.css";
import {useLoop} from "../../../states/homeContext";
import {useSetRecoilState} from "recoil";
import {Authenticated, useReset} from "../../../states/authContext";
import useUser from "../../../utils/userTools";
import {useEffect} from "react";
import {AuthCP} from "../../../SSR";

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
    const current = useLoop({start: 0, end: response.length});
    const {signAsGuest} = useUser();
    const reset = useReset();

    return (
        <>
            <div className={styles['login-img']}>
                {response.map((link, index) => {
                    return index === current ? (
                        <img key={index} src={link} alt="" className={styles['glow_img']}/>
                    ) : index !== current ? (
                        current === 0 && index === response.length - 1 ? (
                            <img key={index} src={link} alt="" className={styles['fade_img']}/>
                        ) : index === current - 1 ? (
                            <img key={index} src={link} alt="" className={styles['fade_img']}/>
                        ) : null
                    ) : null;
                })}
            </div>
            <div id={styles["signIn-button"]} className={styles['signIn-button']} onClick={reset}>
                sign in
            </div>

            <Information response={auth}/>
            <div id={styles.guest} className={styles['signIn-button']} onClick={signAsGuest}>continue as guest</div>
        </>
    );
}
