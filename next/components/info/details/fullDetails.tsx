import React from "react";
import styles from './FullDetails.module.css';
import info from '../Info.module.css';
import Link from 'next/link';
import {SpringMediaInfo} from "../../../../server/classes/springboard";

export default function Details({response}: { response: SpringMediaInfo }) {
    return (
        <div id={styles["info-extra"]}>
            <div id={styles["info-full-overview"]}>
                <div id={styles["item-title"]}>{response.name}</div>
                <br/>
                <span id={styles["item-overview"]}>{response.overview}</span>
            </div>
            <div id={styles["info-extras"]}>
                <div id={styles["info-item-release"]}>
                    <div>Genre: <span className={styles["info-basic"]}>{response.genre}</span></div>
                    <div>Release: <span className={styles["info-basic"]}>{response.release}</span></div>
                    <div>Runtime: <span className={styles["info-basic"]}>{response.runtime}</span></div>
                    <div style={{marginTop: '20px'}}><span className={info.rating}>{response.rating}</span></div>
                    <br/>
                    {response.crew?.length ? <>
                        <div>Production Team:</div>
                        <ul>{response.crew.map((person, v) =>
                            <li key={v}>{person.job}: <span className={styles.click}>{person.name}</span>
                            </li>)}
                        </ul>
                    </> : null}
                    {response.production && response.production.length ?
                        <>
                            <br/>
                            <div>Companies</div>
                            <ul>{response.production.map((item, v) =>
                                <Link key={v} href={'prod?id='+item.id} as={'/productionCompany='+item.name.replace(/\s/g, '+')}>
                                    <li className={styles.click}><span>{item.name}</span></li>
                                </Link>
                            )}
                            </ul>
                        </> : null
                    }
                </div>
                <div id={styles["item-cast"]}>
                    <div>Cast:</div>
                    <ul>{response.cast && response.cast.map((person, v) =>
                        <li key={v}>
                            <span className={styles.click}>{person.name}</span><br/>
                        </li>
                    )}</ul>
                </div>
            </div>
        </div>
    )
}