import React from "react";
import styles from './FullDetails.module.css';
import info from '../Info.module.css';
import {Link} from "../../misc/Loader";
import {SpringMedia} from "../../../../../server/classes/media";

export default function Details({response}: { response: SpringMedia }) {
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
                    {response.collection ?
                        <div>
                            <Link href={'collection?collectionId=' + response.collection.id} as={'collection=' + response.collection.name.replace(/\s/g, '+')}>
                                <span className={styles.click}>{response.collection.name}</span>
                            </Link>
                        </div>
                        : null}
                    <div style={{marginTop: '20px'}}><span className={info.rating}>{response.rating}</span></div>
                    <br/>

                    {response.writers.length ?
                        <div id={styles["item-cast"]}>
                            <br/>
                            <div>Writers:</div>
                            <ul>{response.writers && response.writers.map((person, v) =>
                                <Link key={v} href={`/person?id=${person.id}`} as={'person=' + person.name.replace(/\s/g, '+')}>
                                    <li>
                                        <span className={styles.click}>{person.name}</span>
                                        <br/>
                                    </li>
                                </Link>
                            )}</ul>
                        </div> : null}

                    {response.directors.length ?
                        <div id={styles["item-cast"]}>
                            <br/>
                            <div>Directors:</div>
                            <ul>{response.directors && response.directors.map((person, v) =>
                                <Link key={v} href={`/person?id=${person.id}`} as={'person=' + person.name.replace(/\s/g, '+')}>
                                    <li>
                                        <span className={styles.click}>{person.name}</span>
                                        <br/>
                                    </li>
                                </Link>
                            )}</ul>
                        </div> : null}

                    {response.producers.length ?
                        <div id={styles["item-cast"]}>
                            <br/>
                            <div>Producers:</div>
                            <ul>{response.producers && response.producers.map((person, v) =>
                                <Link key={v} href={`/person?id=${person.id}`} as={'person=' + person.name.replace(/\s/g, '+')}>
                                    <li>
                                        <span className={styles.click}>{person.name}</span>
                                        <br/>
                                    </li>
                                </Link>
                            )}</ul>
                        </div> : null}

                    {response.production && response.production.length ?
                        <>
                            <br/>
                            <div>Companies</div>
                            <ul>{response.production.map((item, v) =>
                                <Link key={v} href={'prod?id=' + item.id}
                                      as={'/productionCompany=' + item.name.replace(/\s/g, '+')}>
                                    <li className={styles.click}><span>{item.name}</span></li>
                                </Link>
                            )}
                            </ul>
                        </> : null
                    }
                </div>
                <div id={styles["item-cast"]}>
                    <div>Cast:</div>
                    <ul>{response.cast.slice(0, 20).map((person, v) =>
                        <Link key={v} href={`/person?id=${person.id}`} as={'person=' + person.name.replace(/\s/g, '+')}>
                            <li>
                                <span className={styles.click}>{person.name}</span>
                                <br/>
                            </li>
                        </Link>
                    )}</ul>
                </div>
            </div>
        </div>
    )
}