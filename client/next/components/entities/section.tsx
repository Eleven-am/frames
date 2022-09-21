import styles from './Sections.module.css';
import Entities from "./multipleEntities/multipleEntity";
import {useFetcher} from "../../../utils/customHooks";
import React, {memo, useState} from "react";
import {SectionPick, SectionType} from "../../../../server/classes/pickAndFrame";
import useUser from "../../../utils/user";
import {Link} from "../misc/Loader";
import {TrendingCollectionProps} from "../../../../server/classes/springboard";

const Loading = memo(() => {
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
})

function UnMemoSectionBone({data, type, display}: SectionPick<SectionType>) {
    return (
        <div className={type === "BASIC" ? styles.sectionContainer : styles.editorContainer}>
            <div className={styles.sectionName}>
                <span>{display}</span>
            </div>
            <Entities response={data} type={type}/>
        </div>
    )
}

export const SectionBone = memo(UnMemoSectionBone);

function Section({location}: { location: string }) {
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

export default memo(Section);

export const TrendingCollection = memo(() => {
    const {response, loading} = useFetcher<TrendingCollectionProps>('/api/load/trendingCollection');

    if (loading) return <Loading/>;

    if (response)
        return (
            <div className={styles.trdCln}>
                <Link href={response.link} as={response.as}>
                    <img className={styles.bck} src={response.backdrop} alt={response.name}/>
                    <div className={styles.foncer}/>
                    <img className={styles.logo} src={response.logo} alt={response.name}/>
                    <img className={styles.poster} src={response.poster} alt={response.name}/>
                </Link>
            </div>
        )

    else return null;
});
