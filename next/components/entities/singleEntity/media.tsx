import React from "react";
import {MediaType} from '@prisma/client';
import styles from './Grid.module.css';
import secondStyles from '../Sections.module.css'
import Image from "next/image";
import Link from "next/link";
import {MediaSection} from "../../../../server/classes/media";

export default function Media({data, media} : {data: MediaSection, media: boolean}) {
    let {backdrop, logo, name, position, id, type} = data;
    let url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");
    url = data.position !== undefined ? '' : url;
    const link = '/'+ (data.position !== undefined ? 'watch': 'info') + '?id=' + id;
    backdrop = (/^images\/drive/.test(backdrop!) ? 'https://drive.google.com/uc?export=view&id=': '') + backdrop!.replace('images/drive/', '');
    logo = (/^images\/drive/.test(logo!) ? 'https://drive.google.com/uc?export=view&id=': '') + logo!.replace('images/drive/', '');

    return (
        <Link href={link} as={url}>
            <div className={media? styles.gridDivHolder : secondStyles.editorLidDiv}>
                <div className={media? styles.gridBackdrop : secondStyles.backdrop}>
                    <Image width={media ? 300: 350} height={media ? 169: 197} src={backdrop} alt={name}/>
                </div>
                <div className={media ? styles.gridLogo : secondStyles.editorLogo}>
                    {logo !== '' ? <img src={logo} alt={name}/> : <div>{name}</div>}
                </div>
                {position && position !== 0 ? <div className={secondStyles.editorGroove}><div className={secondStyles.editorFill} style={{width: (position / 10) + '%'}}/></div>: null}
            </div>
        </Link>
    )
}