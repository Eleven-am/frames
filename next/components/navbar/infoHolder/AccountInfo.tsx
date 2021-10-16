import styles from './Info.module.css';
import {useState} from "react";
import {useRecoilValue} from "recoil";
import {SideMenu} from "../../../states/navigation";
import useUser from "../../../utils/userTools";
import {FramesLink} from "../../misc/Loader";

export default function AccountInfo() {
    const accountContext = useRecoilValue(SideMenu);
    const [visible, setVisible] = useState(false);
    const {user, signOut} = useUser();

    if (user)
        return (
            <div className={styles.holderContainer}
                 style={accountContext === 0 && !visible ? {opacity: "0", pointerEvents: 'none'} : {opacity: "1"}}
                 onMouseEnter={() => setVisible(true)} onMouseLeave={() => {
                setTimeout(() => {
                    setVisible(false);
                }, 200)
            }}>
                <div className={styles.email}>{user.email}</div>
                <div className={styles.spacer}/>
                <FramesLink href={'/settings'}>
                    <div className={styles.text}>Account</div>
                </FramesLink>
                <div className={styles.text}>Buy me coffee</div>
                <div className={styles.text}>Donate to my cause</div>
                <div className={styles.spacer}/>
                <div className={styles.text} onClick={signOut}>log out</div>
            </div>
        )

    else return null;
}