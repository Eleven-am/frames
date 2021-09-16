import styles from './Sections.module.css'
import {useRecoilValue} from "recoil";
import {NavConTextAtom} from "../../../states/navigation";
import {FramesLink as Link} from "../../misc/Loader";

export default function Sections() {
    const navContext = useRecoilValue(NavConTextAtom);
    const sections = ["home", "movies", "tv shows", "genres", "decades", "collections",];
    const paths = ["/", "/movies", "/shows", "/genres", "/decades", "/collections"];

    return (
        <div className={styles.navSections}>
            {sections.map((item, v) => {
                return (
                    <Link key={v} href={paths[v]}>
                        <span
                            className={item === navContext ? styles.activeSection : styles.passiveSections}>{item}</span>
                    </Link>
                );
            })}
        </div>
    );
}
