import styles from "../entities/Sections.module.css";
import {useEffect, useRef, useState} from "react";
import {atom, useRecoilState, useSetRecoilState} from "recoil";
import {Image} from "./Loader";
import frames from "../../assets/frames.png";

interface Inform {
    type: 'error' | 'warn' | 'alert'
    heading: string;
    message: string;
}

interface Confirm {
    type: 'user' | 'client' | 'server';
    heading: string;
    message: string;
    confirm: boolean;
    confirmText: string;
    cancelText: string;
}

const InformDisplayContext = atom<Inform | null>({
    key: 'InformDisplayContext', default: null
})

const ConfirmDisplayContext = atom<Confirm | null>({
    key: 'ConfirmDisplayContext', default: null
})

const ConfirmButtonContext = atom<boolean | null>({
    key: 'ConfirmButtonContext', default: null
})

export const useInfoDispatch = () => useSetRecoilState(InformDisplayContext);

const DropInfoAtom = atom<boolean | null>({
    key: 'DropInfoAtom', default: null
})

const DropConfirmAtom = atom<boolean | null>({
    key: 'DropConfirmAtom', default: null
})

const Information = () => {
    const timer = useRef<NodeJS.Timeout>();
    const timer2 = useRef<NodeJS.Timeout>();
    const timer3 = useRef<NodeJS.Timeout>();
    const [state, setState] = useRecoilState(InformDisplayContext);
    const [drop, setDrop] = useRecoilState(DropInfoAtom);

    useEffect(() => {
        setDrop(drop => {
            return drop === null ? drop : false
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
            }, drop === null ? 0 : 100)
        }
    }, [state])

    if (state)
        return (
            <div className={`${styles.infoCon} ${drop === null ? styles.s : drop ? styles.d : styles.p}`}>
                <div
                    className={`${styles.infoHolder} ${(state.type === 'warn' ? styles.w : state.type === 'error' ? styles.e : styles.a)}`}>
                    <div className={styles.left}>
                        {state.type === 'error' && <svg viewBox="0 0 24 24">
                            <path
                                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>}
                        {state.type === 'warn' && <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>}
                        {state.type === 'alert' && <svg viewBox="0 0 24 24">
                            <polyline points="9 11 12 14 22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>}
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

const Conformation = () => {
    const timer = useRef<NodeJS.Timeout>();
    const timer2 = useRef<NodeJS.Timeout>();
    const timer3 = useRef<NodeJS.Timeout>();
    const [state, setState] = useRecoilState(ConfirmDisplayContext);
    const [drop, setDrop] = useRecoilState(DropConfirmAtom);
    const setBool = useSetRecoilState(ConfirmButtonContext);

    useEffect(() => {
        setDrop(drop => {
            return drop === null ? drop : false
        });

        if (state) {
            timer.current && clearTimeout(timer.current);
            timer2.current && clearTimeout(timer2.current);
            timer3.current = setTimeout(() => {
                setDrop(true);
                const time = state.type === 'user' ? 10: state.type === 'server' ? 5: 7;
                if (!state.confirm)
                    timer.current = setTimeout(() => {
                        setDrop(false);
                        timer2.current = setTimeout(() => {
                            setState(null)
                            setDrop(null);
                        }, 100)
                    }, time * 1000);
            }, drop === null ? 0 : 100)
        }
    }, [state])

    const click = (a: boolean) => {
        setBool(a);
        setDrop(false);
        timer2.current = setTimeout(() => {
            setState(null)
            setDrop(null);
        }, 100);
    }

    if (state)
        return (
            <div className={`${styles.infoCon} ${drop === null ? styles.s : drop ? styles.d : styles.p}`}>
                <div className={`${styles.hldr} ${(state.type === 'server' ? styles.f: state.type === 'user' ? styles.u : styles.w)}`}>
                    <div className={styles.infoHolder2}>
                        <div className={styles.left}>
                            {state.type === 'client' && <svg viewBox="0 0 24 24">
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>}
                            {state.type === 'user' && <svg viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>}

                            {state.type === 'server' && <Image className={styles.leftImg} src={frames}/>}
                        </div>

                        <div className={styles.right}>
                            <span style={{fontSize: 'Larger'}}>{state.heading}</span>
                            <br/>
                            <span>{state.message}</span>
                        </div>
                    </div>
                    <div className={styles.confirmButtons}>
                        <button onClick={() => click(true)}>
                            {state.confirmText}
                        </button>
                        <div className={styles.spcr}/>
                        <button onClick={() => click(false)}>
                            {state.cancelText}
                        </button>
                    </div>
                </div>
            </div>
        )

    return null;
}

export const useConfirmDispatch = () => {
    const [bool, setBool] = useRecoilState(ConfirmButtonContext);
    const [dispatched, setDispatched] = useState(false);
    const setState = useSetRecoilState(ConfirmDisplayContext);
    const confirmRef = useRef<(() => void)>();
    const cancelRef = useRef<(() => void)>();

    useEffect(() => {
        if (bool !== null && dispatched){
            if (bool)
                confirmRef.current?.();
            else
                cancelRef.current?.();
            setBool(null);
            setDispatched(false);
        }
    }, [bool])

    return (a: Confirm & {onOk: (() => void), onCancel: (() => void)}) => {
        setDispatched(true);
        confirmRef.current = a.onOk;
        cancelRef.current = a.onCancel;
        setState(a);
    }
}

export const GlobalModals = () => {

    return (
        <>
            <Information/>
            <Conformation/>
        </>
    )
}