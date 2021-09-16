import Media from "./media";
import styles from "./Grid.module.css";
import {MediaLibrary} from '../../grid/grid';
import {useOnScreen} from "../../../utils/customHooks";
import {useSetRecoilState} from "recoil";
import {GridOnScreenAtom} from "../../../states/gridLibraryContext";
import {useEffect} from "react";

export default function GridEntity(obj: MediaLibrary) {
    const setOnScreen = useSetRecoilState(GridOnScreenAtom);
    const [isVisible, setIsVisible] = useOnScreen<HTMLDivElement>(obj.beacon, '700px');
    useEffect(() => setOnScreen(isVisible), [isVisible]);

    return (
        <div className={styles.gridEntityHolder} ref={setIsVisible}>
            <Media media={true} data={obj} />
            <div className={styles.gridName}>{obj.name}</div>
        </div>
    );
}
