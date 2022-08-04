import styles from './Navbar.module.css';
import {useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {NavConTextAtom, NavSectionAndOpacity, SearchContextAtom, SideMenu} from "./navigation";
import {Role} from "@prisma/client";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Image, Link} from "../misc/Loader";
import frames from "../../assets/frames.png";
import {SettingsSegmentContext} from "../../../utils/modify";
import {useRouter} from "next/router";
import useNotifications, {notificationCount} from "../../../utils/notifications";
import useUser, {ContextType} from "../../../utils/user";
import {SearchPicker} from "../../../../server/classes/media";
import {useFetcher} from "../../../utils/customHooks";

export const useSearch = () => {
    const [errorState, setError] = useState('');
    const [search, setSearch] = useRecoilState(SearchContextAtom);
    const {
        response,
        abort,
        error,
        loading
    } = useFetcher<SearchPicker<'list'>>('/api/load/search?node=list&value=' + search);
    const {
        response: searchResponse,
        error: error2,
        loading: load,
        abort: abort2
    } = useFetcher<SearchPicker<'grid'>>('/api/load/search?node=grid&value=' + search);

    useEffect(() => {
        if (search === '') {
            abort.cancel();
            abort2.cancel();
            setError('');
        }

        return () => {
            abort.cancel();
            abort2.cancel();
        }
    }, [search])

    useEffect(() => {
        if (error || error2)
            setError(error?.message || error2?.message)
    }, [error, error])

    return {
        active: search !== '',
        loading: loading && load,
        grid: searchResponse || [],
        list: response || [],
        error: errorState,
        setSearch
    };
}

function Account() {
    const {user} = useUser();
    const setAccountContext = useSetRecoilState(SideMenu);
    const count = useRecoilValue(notificationCount);

    return (
        <div className={styles['user-account']} onMouseEnter={() => {
            if (user)
                setAccountContext(1)
        }} onMouseLeave={() => {
            setTimeout(() => {
                setAccountContext(0);
            }, 400)
        }}>
            <button className={styles["account-image"]} onClick={() => setAccountContext(val => val !== 0 ? 0 : 1)}>
                <svg viewBox="0 0 512 512">
                    <circle className={styles['ac-circle']} cx="256" cy="256" r="256"/>
                    <path
                        style={user ? user.role !== Role.GUEST ? {fill: "#3cab66"} : {fill: '#c4c362'} : {fill: "#f54e4e"}}
                        d="M442.272,405.696c-11.136-8.8-24.704-15.136-39.424-18.208l-70.176-14.08
                        c-7.36-1.408-12.672-8-12.672-15.68v-16.096c4.512-6.336,8.768-14.752,13.216-23.552c3.456-6.816,8.672-17.088,11.264-19.744
                        c14.208-14.272,27.936-30.304,32.192-50.976c3.968-19.392,0.064-29.568-4.512-37.76c0-20.448-0.64-46.048-5.472-64.672
                        c-0.576-25.216-5.152-39.392-16.672-51.808c-8.128-8.8-20.096-10.848-29.728-12.48c-3.776-0.64-8.992-1.536-10.912-2.56
                        c-17.056-9.216-33.92-13.728-54.048-14.08c-42.144,1.728-93.952,28.544-111.296,76.352c-5.376,14.56-4.832,38.464-4.384,57.664
                        l-0.416,11.552c-4.128,8.064-8.192,18.304-4.192,37.76c4.224,20.704,17.952,36.768,32.416,51.232
                        c2.368,2.432,7.712,12.8,11.232,19.648c4.512,8.768,8.8,17.152,13.312,23.456v16.096c0,7.648-5.344,14.24-12.736,15.68l-70.24,14.08
                        c-14.624,3.104-28.192,9.376-39.296,18.176c-3.456,2.784-5.632,6.848-5.984,11.264s1.12,8.736,4.096,12.032
                        C115.648,481.728,184.224,512,256,512s140.384-30.24,188.16-83.008c2.976-3.296,4.48-7.648,4.096-12.064
                        C447.904,412.512,445.728,408.448,442.272,405.696z"/>
                </svg>
            </button>
            {count ? <div className={styles.notification}>{count}</div> : null}
        </div>
    )
}

function OnlineUsersComponent() {
    const {globalNotification: {online: users}} = useNotifications();

    return (
        <Link href={'/lobby'}>
            <div className={styles.online}
                 title={`${users.length - 1 > 0 ? users.length - 1 : 'No'} user${users.length - 1 > 1 ? 's' : ''} online`}>
                <svg viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {users.length - 1 > 0 ? <div className={styles.onlineCounter}>{users.length - 1}</div> : null}
            </div>
        </Link>
    )
}

function AccountInfo({user, signOut}: {user: ContextType & {username: string} | null, signOut: () => void}) {
    const count = useRecoilValue(notificationCount);
    const setSides = useSetRecoilState(SettingsSegmentContext);
    const accountContext = useRecoilValue(SideMenu);
    const [visible, setVisible] = useState(false);
    const router = useRouter();
    const win = useRef<Window | null>(null);

    const handleClick = useCallback(() => {
        win.current = window.open('https://www.paypal.com/paypalme/RoyOssai', '_blank');
    }, [])

    const setSidesAndPush = useCallback(async (step1: string, step2: string) => {
        setSides({step1, step2});
        router.asPath !== '/settings' && await router.push('/settings');
    }, [setSides, router])

    if (user)
        return (
            <div className={styles.holderContainer}
                 style={accountContext === 0 && !visible ? {opacity: "0", pointerEvents: 'none'} : {opacity: "1"}}
                 onMouseEnter={() => setVisible(true)} onMouseLeave={() => {
                setTimeout(() => {
                    setVisible(false);
                }, 200)
            }}>
                <div className={styles.text}
                     onClick={() => setSidesAndPush('account', 'watch history')}>{user.role === Role.GUEST ? 'Guest: ' : ''}{user.username || user.email}</div>
                <div className={styles.spacer}/>
                <div className={styles.text}
                     onClick={() => setSidesAndPush('account', 'notifications')}>Notifications{count ? `: ${count}` : ''}</div>
                <div className={styles.text} onClick={() => setSidesAndPush('about', 'feedback')}>Make Suggestions</div>
                <div className={styles.text} onClick={handleClick}>Buy me coffee</div>
                <div className={styles.text} onClick={() => setSidesAndPush('about', 'privacy policy')}>Privacy & TOS
                </div>
                {user.role === Role.ADMIN ?
                    <>
                        <div className={styles.spacer}/>
                        <div className={styles.text} onClick={() => setSidesAndPush('manage', 'get contents')}>Manage
                            contents
                        </div>
                    </>
                    : null}
                <div className={styles.spacer}/>
                <div className={styles.text} onClick={signOut}>log out</div>
            </div>
        )

    else return null;
}

function Logo() {
    return (
        <div className={styles.b}>
            <Image src={frames} alt='frames' className={styles.bImg}/>
            <span className={styles.bt}>frames</span>
        </div>
    )
}

function Search() {
    const myRef = useRef<HTMLInputElement>(null);
    const {section} = useRecoilValue(NavSectionAndOpacity);
    const {setSearch} = useSearch();

    const handleSearch = useCallback(() => {
        const search = myRef.current;
        search?.focus();
    }, [])

    return (
        <div className={styles.searchContainer}>
            {section !== 'groupWatch' ?
                <div className={styles['search-holder']}>
                    <button className={styles.searchButton} onClick={handleSearch}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                    <input ref={myRef} onChange={e => setSearch(e.currentTarget.value)} type="text"
                           placeholder="see what's available" className={styles['search-input']}/>
                </div> : null}
            <OnlineUsersComponent/>
            <Account/>
        </div>
    );
}

function Sections() {
    const navContext = useRecoilValue(NavConTextAtom);
    const sections = ["home", "movies", "tv shows", "playlists", "collections"];
    const paths = ["/", "/movies", "/shows", "/playlist", "/collections"];
    const resetSearch = useResetRecoilState(SearchContextAtom);

    return (
        <div className={styles.navSections} onClick={resetSearch}>
            {sections.map((item, v) => {
                return (
                    <Link key={v} href={paths[v]}>
                        <span
                            className={item === navContext ? styles.activeSection : styles.passiveSections}>{item}</span>
                    </Link>
                );
            })}
        </div>
    );
}

export default function Navbar({user, signOut}: {user: ContextType & {username: string} | null, signOut: () => void}) {
    const {opacity, section} = useRecoilValue(NavSectionAndOpacity);
    if (section === 'watch')
        return null;

    else
        return (
            <>
                <div className={styles.navbar} style={opacity! > .8 ? {
                    boxShadow: '2px 12px 12px -12px #000000',
                    background: `linear-gradient(to bottom, rgba(1, 16, 28, 1),  rgba(1, 16, 28, ${opacity}))`
                } : {background: `linear-gradient(to bottom, rgba(1, 16, 28, 1),  rgba(1, 16, 28, ${opacity}))`}}>
                    <div className={styles['nav-holder']}>
                        <Logo/>
                        {section === 'auth' || !user ? null :
                            <>
                                <Sections/>
                                <Search/>
                            </>
                        }
                    </div>
                </div>
                <AccountInfo user={user} signOut={signOut}/>
            </>
        )
}
