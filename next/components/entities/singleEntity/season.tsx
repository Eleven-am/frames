import {useRouter} from "next/router";
import styles from '../multipleEntities/SectionDetails.module.css'
import React from "react";
import {useSetRecoilState} from "recoil";
import {InfoSectionContext} from "../../../states/infoContext";
import {DetailedEpisode} from "../../../../server/classes/episode";

export default function Element(item: DetailedEpisode) {
    const setSection = useSetRecoilState(InfoSectionContext);
    const {backdrop, id, name, overview, position} = item;
    const router = useRouter();

    return (
        <li onClick={async () => {
            if (overview === undefined)
                setSection('Season ' + id);

            else await router.push('/watch?episode=' + id);
        }}>
            <div className={styles.d}>
                <img src={backdrop} alt={name}/>
                <div style={position && position > 0 ? {display: "block"} : {}} className={styles.e}>
                    <div className={styles.fill} style={{width: position + '%'}}/>
                </div>
                <div className={styles.c}>{name}</div>
                {overview ? <p>{overview}</p> : null}
            </div>
        </li>
    );
}
