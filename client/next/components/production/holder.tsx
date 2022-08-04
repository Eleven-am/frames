import styles from "./back.module.css";
import {SectionBone} from "../entities/section";
import {Link, Loading} from "../misc/Loader";
import {useFetcher} from "../../../utils/customHooks";
import {PlayListResponse} from "../../../../server/classes/playlist";
import {FramesCollections, ProductionCompanyInterface} from "../../../../server/classes/springboard";

export default function Holder({response}: { response: ProductionCompanyInterface }) {
    const {response: data} = useFetcher<PlayListResponse | null>('/api/media/prodPlaylist?mediaId=' + response.id);

    if (data)
        return (
            <>
                <Link href={'/watch?playlistId=' + data.id}>
                    <img className={styles.image} src={response.logo} alt={response.name}/>
                </Link>
                <div className={styles.holder}>
                    {response.movies.length ?
                        <SectionBone data={response.movies} type={'BASIC'} display={'movies'}/> : null}
                    {response.shows.length ?
                        <SectionBone data={response.shows} type={'BASIC'} display={'tv shows'}/> : null}
                </div>
            </>
        )

    else return <Loading/>
}

export function CollectionHolder({response}: { response: FramesCollections }) {
    const {response: data} = useFetcher<PlayListResponse | null>('/api/media/collectionPlaylist?mediaId=' + response.id, {
        revalidateOnFocus: false,
    });

    if (data)
        return (
            <>
                <Link href={'/watch?playlistId=' + data.id}>
                    <span className={styles.image}>{response.name}</span>
                </Link>
                <div className={styles.holder}>
                    {response.media.length ?
                        <SectionBone data={response.media} type={'BASIC'} display={response.name}/> : null}
                </div>
            </>
        )

    else return <Loading/>
}
