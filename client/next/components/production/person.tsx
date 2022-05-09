import {Loading} from "../misc/Loader";
import styles from "./back.module.css";
import {Link} from "../misc/Loader";
import {SectionBone} from "../entities/section";
import {useEffect, useRef, useState} from "react";
import useOnScroll from "../../../utils/opacityScroll";
import {useFetcher} from "../../../utils/customHooks";
import {PersonInterface} from "../../../../server/classes/media";
import {PlayListResponse} from "../../../../server/classes/listEditors";
import {HoverContainer} from "../buttons/Buttons";

interface ErrorProps {
    name: string;
    message: string;
}

function MinHolder ({data, person}: {data: number, person: PersonInterface}) {
    const {reset, setReference, onScroll, values} = useOnScroll();
    const reference = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setReference(reference.current);
    }, [reference])

     useEffect(() => {
         return () => reset();
     }, [])

    return (
        <div className={styles.bar} style={{background: `rgba(1, 16, 28, ${values.lowOpacity > 0.7 ? 0.7 : values.lowOpacity})`}} onScroll={onScroll}>
            <Link href={'/watch?playlistId='+data}>
                <span className={styles.image}>{person.name}</span>
            </Link>
            <div className={styles.holder}>
                <div className={styles.bio} ref={reference}>{person.overview}</div>
                {person.castMedia.length ? <SectionBone data={person.castMedia} type={'BASIC'} display={'media ' + person.name + ' starred in'}/> : null}
                {person.writtenMedia.length ? <SectionBone data={person.writtenMedia} type={'BASIC'} display={'media written by ' + person.name}/> : null}
                {person.directedMedia.length ? <SectionBone data={person.directedMedia} type={'BASIC'} display={'media ' + person.name + ' directed'}/> : null}
                {person.producedMedia.length ? <SectionBone data={person.producedMedia} type={'BASIC'} display={'media ' + person.name + ' produced'}/> : null}
            </div>
            <img className={styles.person} src={person.photo} alt={person.name}/>
        </div>
    )
}

export const ErrorPage = ({error, offline}: {error: ErrorProps, offline?: boolean}) => {
    const [name, setName] = useState(error.name);

    const hovering = (b: boolean) => {
        if (b) {
            setName('Return to the home page');
        } else {
            setName(error.name);
        }
    }

    return (
        <div className={styles.bar2}>
            <HoverContainer hovering={hovering}>
                {offline?
                    <span className={styles.stnImg}>{name}</span>:
                    <Link href={'/'}>
                        <span className={styles.stnImg}>{name}</span>
                    </Link>
                }
            </HoverContainer>
            <span>{error.message}</span>
        </div>
    )
}

export default function Holder({person}: {person: PersonInterface}) {
    const {response: data, loading, error} = useFetcher<PlayListResponse | null>('/api/media/personPlaylist?mediaId=' + person.id);

    if (loading || error)
        return <Loading/>

    else if (data)
        return <MinHolder data={data.id} person={person}/>

    else return null;
}
