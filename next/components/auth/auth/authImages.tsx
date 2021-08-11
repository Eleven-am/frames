import Link from "next/link";
import styles from "./Auth.module.css";
import {useLoop} from "../../../states/homeContext";
import {useRecoilState, useSetRecoilState} from "recoil";
import {AuthContextProcessAtom, AuthPicker} from "../../../states/authContext";
import useUser from "../../../utils/userTools";

export default function AuthImages({response}: {response: string[]}) {
    const current = useLoop({start: 0, end: response.length});
    const [process, dispatch] = useRecoilState(AuthContextProcessAtom);
    const setPicker = useSetRecoilState(AuthPicker);
    const {signAsGuest} = useUser();

    const signIn = () => {
        if (process !== 'pick') {
            dispatch('pick');
            setPicker(true);
        }
    }

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
            <div id={styles["signIn-button"]} className={styles['signIn-button']} onClick={signIn}>
                sign in
            </div>

            <div style={{
                position: "fixed",
                bottom: "4vh",
                color: "white",
                width: "100%",
                textAlign: "center",
                fontFamily: "'Roboto', sans-serif",
            }}>
                <span>Copyright © 2021 Roy Ossai.</span>
                <div style={{lineHeight: "10px"}}>
                        <span style={{fontSize: "x-small"}}>
                          All rights reserved. No document may be reproduced for commercial
                          use without written approval from the author.
                        </span>
                    <br/>
                    <span style={{fontSize: "x-small"}}>
                                Videos only stream till the 5 minute mark for guest
                        </span>
                </div>
            </div>
            <div id={styles.guest} className={styles['signIn-button']} onClick={signAsGuest}>continue as guest</div>
        </>
    );
}
