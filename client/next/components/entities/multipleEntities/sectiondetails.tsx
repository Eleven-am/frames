import styles from "./SectionDetails.module.css";
import React from "react";
import Element from "../singleEntity/season";
import {SpringEpisode} from "../../../../../server/classes/media";

export default function SectionDetails({response, entities}: {entities:  React.RefObject<HTMLUListElement>, response: SpringEpisode[]}) {
    return(
        <div className={styles.a}>
            <ul className={styles.b} ref={entities}>
                {response.map((item, value) =>
                    <Element key={value} {...item}/>)}
            </ul>
        </div>
    )
}