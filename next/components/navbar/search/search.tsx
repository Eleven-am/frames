import React, {useEffect, useRef} from "react";
import styles from "./Search.module.css";
import Account from "../account/Account";
import {useSetRecoilState} from "recoil";
import {SearchContextAtom} from "../../../states/navigation";

export default function Search() {
    const myRef = useRef<HTMLInputElement>(null);
    const setSearchContext = useSetRecoilState(SearchContextAtom);
    useEffect(() => setSearchContext(''), [])

    const handleSearch = () => {
        const search = myRef.current;
        search?.focus();
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles['search-holder']}>
                <button className={styles.searchButton} onClick={() => handleSearch()}>
                    <svg viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
                <input ref={myRef} onChange={e => setSearchContext(e.currentTarget.value)} type="text" placeholder="see what's available" className={styles['search-input']}/>
            </div>
            <Account/>
        </div>
    );
}
