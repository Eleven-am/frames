import {useRouter} from "next/router";
import styles from '../multipleEntities/SectionDetails.module.css'
import React, {memo} from "react";
import {useSetRecoilState} from "recoil";
import {InfoSectionContext} from "../../info/infoContext";
import {SpringEpisode} from "../../../../../server/classes/media";

function Element(item: SpringEpisode) {
    const setSection = useSetRecoilState(InfoSectionContext);
    const {backdrop, id, name, overview, show, position, type} = item;
    const router = useRouter();

    return (
        <li onClick={async () => {
            if (type === 'SEASON')
                setSection(name);

            else await router.push('/watch?episodeId=' + id);
        }}>
            <div className={styles.d}>
                <img src={backdrop ? backdrop : type === 'EPISODE' ? show.backdrop : show.poster} alt={name}/>
                <div style={position && position > 0 ? {display: "block"} : {}} className={styles.e}>
                    <div className={styles.fill} style={{width: position + '%'}}/>
                </div>
                <div className={styles.c}>{name}</div>
                {overview ? <p>{overview}</p> : null}
            </div>
        </li>
    );
}

export default memo(Element);
