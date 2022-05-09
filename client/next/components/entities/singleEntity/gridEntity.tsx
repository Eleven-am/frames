import Media from "./media";
import styles from "./Grid.module.css";
import {SpringMedia} from "../../../../../server/classes/media";

export default function GridEntity(obj: Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'>) {
    return (
        <div className={styles.gridEntityHolder} >
            <Media media={true} data={obj} />
            <div className={styles.gridName}>{obj.name}</div>
        </div>
    );
}
