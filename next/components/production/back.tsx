import {useLoop} from "../../states/homeContext";
import style from "./back.module.css";
import authStyle from '../auth/auth/Auth.module.css';

export default function Background({response, auth}: { auth?: boolean, response: string[] }) {
    const {current, prev} = useLoop({start: 0, end: response.length});
    const styles = auth ? authStyle : style;

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