import style from "./back.module.css";
import authStyle from '../auth/Auth.module.css';
import {useLoop} from "../../../utils/customHooks";
import {useMemo} from "react";

export default function Background({response, auth}: { auth?: boolean, response: string[] }) {
    const {current, prev} = useLoop({start: 0, end: response.length});

    const styles = useMemo(()  => auth ? authStyle : style, [auth]);

    return (
        <>
            <div className={styles['login-img']}>
                {response.map((link, index) =>
                    index === current || index === prev ?
                        index === prev ?
                            <img key={index} src={link} alt="" className={styles['fade_img']}/> :
                            <img key={index} src={link} alt="" className={styles['glow_img']}/> :
                        null
                )}
            </div>
        </>
    );
}
