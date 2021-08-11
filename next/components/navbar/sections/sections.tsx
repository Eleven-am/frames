import {useRouter} from "next/router";
import styles from './Sections.module.css'
import {useRecoilValue, useSetRecoilState} from "recoil";
import {NavConTextAtom} from "../../../states/navigation";
import {InformDisplayContext} from "../../misc/inform";

export default function Sections() {
    const navContext = useRecoilValue(NavConTextAtom)
    const setInform = useSetRecoilState(InformDisplayContext);
    const sections = ["home", "movies", "tv shows", "genres", "decades", "playlists",];
    const paths = ["/", "/movies", "/shows", "/genres", "/decades", "/playlist"];
    const history = useRouter();

    async function routeOut(index: number) {
        if (index !== 5)
            await history.push(paths[index]);

        else setInform({
            type: "error",
            heading: 'feature not available',
            message: 'The playlist feature is currently under development'
        })
    }

    return (
        <div className={styles.navSections}>
            {sections.map((item, v) => {
                return (
                    <span key={v} className={item === navContext ? styles.activeSection : styles.passiveSections} onClick={() => routeOut(v)}>{item}</span>
                );
            })}
        </div>
    );
}
