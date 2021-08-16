import React, {useEffect, useRef, useState} from "react";
import styles from './auth/Auth.module.css';
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    AuthContextEmailAtom,
    AuthContextErrorAtom,
    AuthContextHandler,
    AuthContextPasswordAtom,
    AuthErrors,
    AuthFade,
    AuthKeyAtom,
    AuthPicker, useReset
} from "../../states/authContext";
import {useEventListener, useWeSocket} from "../../utils/customHooks";
import useUser from "../../utils/userTools";

const ENDPOINT = 'https://frameshomebase.vercel.app/api/oauth?type=';
const SOCKET = 'wss://8hbqlcl04f.execute-api.eu-west-3.amazonaws.com/production';

interface SocketResponse {
    action?: string;
    message?: { connectionId: string };
    user?: {
        oauthPass: number;
        photo: string;
        user_name: string;
        email: string;
        state: string;
    }
}

function useAuth() {
    const {confirmAuthKey} = useUser();
    const [lAuth, setLAuth] = useState(false);
    const [valid, setValid] = useState(false);
    const [auth, setAuth] = useRecoilState(AuthKeyAtom);
    const {authError} = useRecoilValue(AuthErrors);
    const setError = useSetRecoilState(AuthContextErrorAtom);

    const confirmKey = async () => {
        const res = await confirmAuthKey(auth);
        if (res !== 0) {
            const error = res === -1 ? 'invalid auth key' : 'this auth key has already been used';
            setError(error);
            setLAuth(true);
        } else
            setValid(true);
    }

    useEffect(() => {
        if (auth.length === 23)
            confirmKey()

        else {
            if (auth === 'homeBase')
                setValid(true);

            else
                setValid(false);

            setError(null);
            setLAuth(false);
        }
    }, [auth])

    return {authError: authError || lAuth, auth, setAuth, valid}
}

function Login() {
    const [state, dispatch] = useRecoilState(AuthContextHandler);
    const [email, setEmail] = useRecoilState(AuthContextEmailAtom);
    const [pass, setPass] = useState('');
    const {confirmMail, signIn} = useUser();
    const {emailError} = useRecoilValue(AuthErrors);
    const {error, process, fade} = state;

    const submit = () => {
        dispatch({fade: true});
        setTimeout(async () => {
            if (process === 'email') {
                if (email !== '' && !error && !emailError)
                    dispatch({
                        process: await confirmMail(email)
                    })

                else dispatch({error: 'enter a valid email address'});
            } else if (process === 'password')
                await signIn(email, pass);
        }, 200)
    }

    useEffect(() => {
        setTimeout(() => {
            if (fade) {
                dispatch({fade: false});
            }
        }, 1500)
    }, [fade])

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            submit();
    })

    return (
        <>
            <div className={styles["log-input-holder"]}>
                <input readOnly={process !== "email"}
                       className={process === "email" ? styles["log-input"] : styles["log-pass"]}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="email"
                       placeholder="enter your email address" onChange={(e) =>
                    setEmail(e.currentTarget.value)}/>
                <input className={process === "password" ? styles["log-input"] : styles["log-pass"]}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="password"
                       placeholder="enter your password" onChange={(e) =>
                    setPass(e.currentTarget.value)}/>
            </div>
            <div className={styles["submit-width"]}>
                <button
                    className={styles["log-submit"]}
                    type="button"
                    style={{width: "100%"}}
                    onClick={submit}
                >
                    Submit
                </button>
            </div>
        </>
    )
}

function Create() {
    const submitWidth = useRef<HTMLButtonElement>(null);
    const {signUp} = useUser();
    const dispatch = useSetRecoilState(AuthContextHandler);
    const fade = useRecoilValue(AuthFade);
    const [email, setEmail] = useRecoilState(AuthContextEmailAtom);
    const [pass, setPass] = useRecoilState(AuthContextPasswordAtom);
    const setError = useSetRecoilState(AuthContextErrorAtom);
    const [cPass, setCPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const {emailError, passError} = useRecoilValue(AuthErrors);
    const {auth, setAuth, authError, valid} = useAuth();

    const submit = async () => {
        if (email !== '' && !emailError && !passError && !authError)
            await signUp(email, pass, auth);
    }

    useEffect(() => {
        setTimeout(() => {
            if (fade) {
                dispatch({fade: false});
                if (submitWidth.current)
                    submitWidth.current.style.width = "40%";
            }
        }, 500)
    }, [])

    useEffect(() => {
        if (confirmPass !== pass && confirmPass !== '') {
            setError('Passwords do not match');
            setCPass(true);
        } else {
            setError(null);
            setCPass(false);
        }
    }, [confirmPass])

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            submit();
    })

    return (
        <>
            <div className={styles["create-flex"]}>
                <div className={styles["create-holders"]}>
                    <label htmlFor="authKey">auth key</label>
                    <br/>
                    <input maxLength={23}
                           style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"}: {}} type="text"
                           placeholder="enter your auth key" onChange={(e) => setAuth(e.currentTarget.value)}/>
                    <div className={styles.authSpacers}/>
                    <label htmlFor="create-pass">password</label>
                    <br/>
                    <input style={passError || cPass ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                           type="password" placeholder="enter your password"
                           onChange={(e) => setPass(e.currentTarget.value)}/>
                </div>
                <div className={styles["create-holders"]}>
                    <label htmlFor="create-email">email address</label>
                    <br/>
                    <input style={emailError ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="text"
                           placeholder="enter your email address" value={email}
                           onChange={(e) => setEmail(e.currentTarget.value)}/>
                    <div className={styles.authSpacers}/>
                    <label htmlFor="confirm-pass">confirm password</label>
                    <br/>
                    <input style={cPass ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                           type="password" placeholder="confirm your password"
                           onChange={(e) => setConfirmPass(e.currentTarget.value)}/>
                </div>
            </div>
            <div className={styles["log-label-div"]}>
                <div className={styles["submit-width"]}>
                    <button
                        ref={submitWidth}
                        className={styles["log-submit"]}
                        type="button"
                        onClick={submit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </>
    )
}

function Pick() {
    const {oauthAuth, confirmMail} = useUser();
    const picker = useRecoilValue(AuthPicker);
    const {data, connected, disconnect, sendData} = useWeSocket<SocketResponse>(SOCKET);
    const win = useRef<Window | null>(null);
    const dispatch = useSetRecoilState(AuthContextHandler);
    const {auth, setAuth, authError, valid} = useAuth();

    const attemptAuth = async () => {
        if (data?.user) {
            win.current?.close();
            const {user_name, oauthPass, email} = data.user;
            const res = await confirmMail(email);
            if (res === 'password')
                await oauthAuth(user_name, oauthPass, email);
        }
    }

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            submit();
    })

    useEventListener('visibilitychange', event => {
        if (!event.srcElement.hidden)
            dispatch({fade: false});
    })

    const handleClicks = async (type: string) => {
        dispatch({fade: true})
        setTimeout(() => {
            if (type === 'email') {
                dispatch({process: 'email'});
            } else {
                if (data?.message) {
                    let url = ENDPOINT + type + '&state=' + (data.message.connectionId.replace('=', '%%%'));
                    win.current = window.open(url, '_blank');
                }
            }
        }, 400)
    }

    const submit = () => {
        dispatch({fade: true});
        setTimeout(async () => {
            if (data?.user && !authError) {
                const {user_name, oauthPass, email} = data.user;
                await oauthAuth(user_name, oauthPass, email, auth);
            }
        }, 400)
    }

    useEffect(() => {
        attemptAuth();
    }, [data])

    useEffect(() => {
        if (!picker)
            dispatch({fade: false});
    }, [picker])

    useEffect(() => {
        if (connected)
            sendData({action: 'declare'});
    }, [connected])

    useEffect(() => {
        return () => disconnect();
    }, [])

    return (
        <>
            {picker ?
                <div style={{marginTop: '50px'}}>
                    <div className={styles.pick} onClick={() => handleClicks('genFacebook')}
                         style={{background: 'rgba(66, 103, 178, 0.5)', color: 'rgba(255, 255, 255, 0.9)'}}>
                        <img src='/fb.png' alt="facebook"/>
                        sign in with facebook
                    </div>

                    <div className={styles.pick} onClick={() => handleClicks('genGoogle')}
                         style={{background: 'rgba(255, 255, 255, 0.7)', color: 'rgba(1, 16, 28, 0.8)'}}>
                        <img src='/ggl.png' alt="google"/>
                        sign in with google
                    </div>

                    <div className={styles.pick} style={{marginBottom: '0'}} onClick={() => handleClicks('email')}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="4"/>
                            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                        </svg>
                        sign in with email
                    </div>
                </div> :
                <>
                    <div className={styles["log-input-holder"]}>
                        <input
                            className={styles["log-input"]}
                            style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"}: {}} type="text"
                            placeholder="enter an auth key" onChange={(e) =>
                            setAuth(e.currentTarget.value)}/>
                    </div>
                    <div className={styles["submit-width"]}>
                        <button
                            className={styles["log-submit"]}
                            type="button"
                            style={{width: "100%"}}
                            onClick={submit}
                        >
                            Submit
                        </button>
                    </div>
                </>
            }
        </>
    )
}

export default function LoginForm() {
    const reset = useReset();
    const picker = useRecoilValue(AuthPicker);
    const {error, process, fade} = useRecoilValue(AuthContextHandler);

    useEffect(() => {
        return () => reset();
    }, [])

    return (
        <div className={styles['login-container']}>
            <div
                className={process === "create" ? fade ? `${styles.fade_input} ${styles["create-acc-div"]}` : styles["create-acc-div"] : fade ? `${styles.fade_input} ${styles["log-input-div"]}` : styles["log-input-div"]}>
                <div className={styles["log-label-div"]} style={error ? {color: "rgba(245, 78, 78, .9)"} : {}}>
                    {error ? error : process === "email" ? "email address" : process === "password" ? "enter password" : process === "create" ? "create an account, it's free!" : picker ? "select sign in options" : 'enter an auth key'}
                </div>
                {process === 'pick' ? <Pick/> : process === "create" ? <Create/> : <Login/>}
            </div>
        </div>
    )
}
