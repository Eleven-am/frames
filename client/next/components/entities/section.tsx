import styles from './Sections.module.css';
import Entities from "./multipleEntities/multipleEntity";
import {useFetcher} from "../../../utils/customHooks";
import {SectionPick, SectionType} from "../../../../server/classes/listEditors";
import useUser from "../../../utils/userTools";
import {useState} from "react";

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

export function SectionBone({data, type, display}: SectionPick<SectionType>) {
    return (
        <div className={type === "BASIC" ? styles.sectionContainer : styles.editorContainer}>
            <div className={styles.sectionName}>
                <span>{display}</span>
            </div>
            <Entities response={data} type={type}/>
        </div>
    )
}

export default function Section({location}: { location: string }) {
    const {user} = useUser();
    const [tmpUser, setTmpUser] = useState<any>(null);
    const {loading, response} = useFetcher<SectionPick<SectionType>>('/api/load/' + location, {
        isPaused: () => {
            if (location === 'added')
                return false;

            return tmpUser?.session === user?.session;
        },
        onSuccess: () => setTmpUser(user)
    });

    if (loading) return <Loading/>

    else if (response && response.data && response.data.length)
        return <SectionBone {...response}/>

    else return null;
}