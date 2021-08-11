import styles from "./SectionDetails.module.css";
import React from "react";
import Element from "../singleEntity/season";
import {DetailedEpisode} from "../../../../server/classes/episode";

export default function SectionDetails({response, entities}: {entities:  React.RefObject<HTMLUListElement>, response: DetailedEpisode[]}) {
    return(
        <div className={styles.a}>
            <ul className={styles.b} ref={entities}>
                {response.map((item, value) =>
                    <Element key={value} {...item}/>)}
            </ul>
        </div>
    )
}