import ss from "../ACCOUNT.module.css";
import {useManageSections} from "../../../../utils/modify";

export default function About() {
    const response = ['about', 'help', 'feedback', 'privacy policy', 'terms of use'];
    const [side, setSide] = useManageSections(response);

    return (
        <div className={ss.display}>
            <ul className={ss.side}>
                {response?.map((e, v) => <li key={v} onClick={() => setSide(e)}
                                             className={e === side ? `${ss.li} ${ss.ac}` : ss.li}>
                    {e}
                </li>)}
            </ul>
        </div>
    )
}