import styles from './Sections.module.css';
import Entities from "./multipleEntities/multipleEntity";
import {useFetcher} from "../../utils/customHooks";
import {SectionInterface} from "../../../server/classes/playback";
import {MediaSection} from "../../../server/classes/media";

const Loading = () => {
    return (
        <div className={styles.sectionContainer}>
            <div className={styles.sectionName}>
                <div className={`${styles.spectorSpanLoading} ${styles.loading}`}/>
            </div>
            <div className={styles.sectionList}>
                <div className={`${styles.sectionHolderLoading} ${styles.loading}`}/>
            </div>
        </div>
    )
}

export function SectionBone({data, type, display}: {data: MediaSection[], type: string, display: string}) {
    return (
        <div className={type === 'basic' ? styles.sectionContainer: styles.editorContainer}>
            <div className={styles.sectionName}>
                <span>{display}</span>
            </div>
            <Entities response={data} type={type}/>
        </div>
    )
}

export default function Section({location}: {location: string}) {
    const {loading, error, response} = useFetcher<SectionInterface>('/api/load/' + location);
    if (loading || error)
        return <Loading/>

    else if (response && response.data && response.data.length)
        return <SectionBone {...response}/>

    else
        return null;
}