import {FramesCompany} from "../../../server/classes/media";
import styles from "./back.module.css";
import {SectionBone} from "../entities/section";
import {useFetcher} from "../../utils/customHooks";
import {Loading} from "../misc/Loader";
import Link from 'next/link';

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