import styles from "../entities/Sections.module.css";
import {useEffect, useRef, useState} from "react";
import {atom, useRecoilState} from "recoil";

interface Inform {
    type: 'error' | 'warn' | 'alert';
    heading: string;
    message: string;
}

export const InformDisplayContext = atom<Inform | null>({
    key: 'InformDisplayContext',
    default: null
})

export const Information = () => {
    const timer = useRef<NodeJS.Timeout>();
    const timer2 = useRef<NodeJS.Timeout>();
    const timer3 = useRef<NodeJS.Timeout>();
    const [state, setState] = useRecoilState(InformDisplayContext);
    const [drop, setDrop] = useState<boolean|null>(null);

    useEffect(() => {
        setDrop(drop => {
            return drop === null? drop: false
        });
        if (state) {
            timer.current && clearTimeout(timer.current);
            timer2.current && clearTimeout(timer2.current);
            timer3.current = setTimeout(() => {
                setDrop(true);
                const time = state.type === 'error' ? 7 : state.type === "warn" ? 5 : 3;
                timer.current = setTimeout(() => {
                    setDrop(false);
                    timer2.current = setTimeout(() => {
                        setState(null)
                        setDrop(null);
                    }, 100)
                }, time * 1000);
            }, drop === null? 0: 100)
        }
    }, [state])

    if (state)
        return (
            <div className={`${styles.infoCon} ${drop === null? styles.s: drop ? styles.d : styles.p}`}>
                <div
                    className={`${styles.infoHolder} ${(state.type === 'warn' ? styles.w : state.type === 'error' ? styles.e : styles.a)}`}>
                    <div className={styles.left}>
                        {state.type === 'error' ? <svg viewBox="0 0 24 24">
                            <path
                                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg> : state.type === 'warn' ? <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg> : <svg viewBox="0 0 24 24">
                            <polyline points="9 11 12 14 22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        }
                    </div>

                    <div className={styles.right}>
                        <span style={{fontSize: 'Larger'}}>{state.heading}</span>
                        <br/>
                        <span>{state.message}</span>
                    </div>
                </div>
            </div>
        )

    else return null
}