import {FramesPerson} from "../../../server/base/tmdb_hook";
import {useFetcher} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import styles from "./back.module.css";
import Link from "next/link";
import {SectionBone} from "../entities/section";

export default function Holder({person}: {person: FramesPerson}) {
    const {response: data, loading, error} = useFetcher<number | null>('/api/media/personPlaylist?id=' + person.id);

    if (loading || error)
        return <Loading/>

    return (
        <div className={styles.bar}>
            <Link href={'/watch?next=x'+data}>
                <span className={styles.image}>{person.name}</span>
            </Link>
            <div className={styles.holder}>
                <div className={styles.bio}>{person.biography}</div>
                {person.movie_cast.length ? <SectionBone data={person.movie_cast} type={'basic'} display={'movies'}/>: null}
                {person.tv_cast.length ? <SectionBone data={person.tv_cast} type={'basic'} display={'tv shows'}/>: null}
                {person.production.length ? <SectionBone data={person.production} type={'basic'} display={'produced'}/>: null}
            </div>
            <img className={styles.person} src={person.poster} alt={person.name}/>
        </div>
    )
}
