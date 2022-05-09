import React from "react";
import {MediaType} from '@prisma/client';
import styles from './Grid.module.css';
import secondStyles from '../Sections.module.css'
import Image from "next/image";
import {Link} from "../../misc/Loader";
import {SpringMedia} from "../../../../../server/classes/media";

export default function Media({data, media} : {data: Pick<SpringMedia, 'id' | 'type' | 'name' | 'backdrop' | 'logo'> & {position?: number, location?: string}, media: boolean}) {
    let {backdrop, logo, name, position, id, type} = data;
    let url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");
    url = data.location ? '' : url;
    const link = data.location ?  data.location: '/info?mediaId=' + id;

    return (
        <Link href={link} as={url}>
            <div className={media? styles.gridDivHolder : secondStyles.editorLidDiv}>
                <div className={media? styles.gridBackdrop : secondStyles.backdrop}>
                    <Image width={media ? 300: 350} height={media ? 169: 197} src={backdrop} alt={name}/>
                </div>
                <div className={media ? styles.gridLogo : secondStyles.editorLogo}>
                    {logo ? <img src={logo} alt={name}/> : <div>{name}</div>}
                </div>
                {position && position !== 0 ? <div className={secondStyles.editorGroove}><div className={secondStyles.editorFill} style={{width: position + '%'}}/></div>: null}
            </div>
        </Link>
    )
}