import styles from './Navbar.module.css';
import Logo from "./logo/logo";
import Sections from "./sections/sections";
import Search from "./search/search";
import {useRecoilValue} from "recoil";
import {NavSectionAndOpacity} from "../../states/navigation";

export default function Navbar() {
    const {opacity, section} = useRecoilValue(NavSectionAndOpacity);
    if (section === 'watch')
        return null;

    else
        return (
            <div className={styles.navbar} style={opacity! > .8 ? {
                boxShadow: '2px 12px 12px -12px #000000',
                background: `linear-gradient(to bottom, rgba(1, 16, 28, 1),  rgba(1, 16, 28, ${opacity}))`
            } : {background: `linear-gradient(to bottom, rgba(1, 16, 28, 1),  rgba(1, 16, 28, ${opacity}))`}}>
                <div className={styles['nav-holder']}>
                    <Logo/>
                    {section === 'login' ? null :
                        <>
                            <Sections/>
                            <Search/>
                        </>
                    }
                </div>
            </div>
        )
}