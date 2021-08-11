import React from "react";
import styles from './LOGO.module.css';

export default function Logo () {
    return (
        <div className={styles.b}>
            <img src='/frames.png' alt='frames'/>
            <span className={styles.bt}>frames</span>
        </div>
    )
}

