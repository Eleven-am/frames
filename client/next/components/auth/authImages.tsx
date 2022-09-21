import styles from "./Auth.module.css";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {AuthContextHandler, AuthContextProcessAtom, Authenticated, useReset} from "./authContext";
import {useCallback, memo} from "react";
import Background from "../misc/back";
import useUser from "../../../utils/user";

const Information = memo(() => {
    const response = useRecoilValue(Authenticated);

    return (
        <div style={{
            position: "fixed",
            bottom: "4vh",
            color: "white",
            width: "100%",
            textAlign: "center",
            fontFamily: "'Roboto', sans-serif",
        }}>
            <span>{response?.cpRight}</span>
            <div style={{lineHeight: "10px"}}>
                <span style={{fontSize: "x-small"}}>{response?.aReserved}</span>
                <br/>
                <span style={{fontSize: "x-small"}}>
                    Videos only stream till the 5 minute mark for guest
                </span>
            </div>
        </div>
    )
});

export const AuthImages = memo(({response}: { response: string[] }) => {
    const process = useRecoilValue(AuthContextProcessAtom);
    const dispatch = useSetRecoilState(AuthContextHandler);

    const {signAsGuest} = useUser();
    const reset = useReset();

    const handleClick = useCallback(() => {
        reset();
    }, [reset]);

    const handleGuest = useCallback(async () => {
        dispatch({fade: true});
        dispatch({error: await signAsGuest()});
    }, [dispatch, signAsGuest]);

    return (
        <>
            <Background response={response} auth={true}/>
            {process !== 'pick' ?
                <div id={styles["signIn-button"]} className={styles['signIn-button']} onClick={handleClick}>
                    select a provider
                </div> : null}

            <Information/>
            <div id={styles.guest} className={styles['signIn-button']} onClick={handleGuest}>continue as guest</div>
        </>
    );
});
