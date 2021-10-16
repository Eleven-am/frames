import {FramesCollection, FramesCompany} from "../../../server/classes/media";
import styles from "./back.module.css";
import {SectionBone} from "../entities/section";
import {useFetcher} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import {FramesLink as Link} from "../misc/Loader";

export default function Holder({response}: {response: FramesCompany}) {
    const {response: data} = useFetcher<number | null>('/api/media/prodPlaylist?id=' + response.name);

    if (data)
        return (
            <>
                <Link href={'/watch?next=x'+data}>
                    <img className={styles.image} src={response.logo} alt={response.name}/>
                </Link>
                <div className={styles.holder}>
                    {response.movies.length ? <SectionBone data={response.movies} type={'basic'} display={'movies'}/>: null}
                    {response.shows.length ? <SectionBone data={response.shows} type={'basic'} display={'tv shows'}/>: null}
                </div>
            </>
        )

    else return <Loading/>
}

export function CollectionHolder({response}: {response: FramesCollection}) {
    const {response: data} = useFetcher<number | null>('/api/media/collectionPlaylist?id=' + response.collectionId);

    if (data)
        return (
            <>
                <Link href={'/watch?id='+data}>
                    <span className={styles.image}>{response.name}</span>
                </Link>
                <div className={styles.holder}>
                    {response.movies.length ? <SectionBone data={response.movies} type={'basic'} display={'movies'}/>: null}
                    {response.shows.length ? <SectionBone data={response.shows} type={'basic'} display={'tv shows'}/>: null}
                </div>
            </>
        )

    else return <Loading/>
}