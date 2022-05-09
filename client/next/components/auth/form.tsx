import React, {useEffect, useRef, useState} from "react";
import styles from './Auth.module.css';
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import googleLogo from '../../assets/ggl.png';
import facebook from '../../assets/fb.png';
import Image from "next/image";

import {
    AuthContextEmailAtom,
    AuthContextHandler,
    AuthContextPasswordAtom,
    AuthErrors,
    AuthFade,
    Process,
    useReset
} from "./authContext";
import {useEventListener} from "../../../utils/customHooks";
import useUser, {Provider, useAuth} from "../../../utils/userTools";

function Login() {
    const [state, dispatch] = useRecoilState(AuthContextHandler);
    const [email, setEmail] = useRecoilState(AuthContextEmailAtom);
    const [pass, setPass] = useState('');
    const {confirmMail, signIn, forgotPassword} = useUser();
    const {emailError} = useRecoilValue(AuthErrors);
    const {error, process} = state;

    const submit = () => {
        dispatch({fade: true, error: null});
        setTimeout(async () => {
            if (process === 'email') {
                if (email !== '' && !error && !emailError)
                    dispatch({
                        process: await confirmMail(email)
                    })

                else dispatch({error: 'enter a valid email address'});
                fade()
            } else if (process === 'password')
                dispatch({error: await signIn(email, pass)});
        }, 500)
    }

    const handleForgotPassword = () => {
        dispatch({fade: true, error: null});
        setTimeout(async () => {
            if (email !== '' && !emailError) {
                const data = await forgotPassword(email);
                if (data)
                    dispatch({process: 'reset'});
                else
                    dispatch({error: 'email not found'});
            } else
                dispatch({error: 'enter a valid email address', process: 'email'});
            fade()
        }, 500)
    }

    const fade = () => setTimeout(() => dispatch({fade: false}), 1000);

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            submit();
    })

    useEffect(() => {
        fade();
    }, [])

    return (
        <>
            <div className={styles["log-input-holder"]}>
                <input readOnly={process !== "email"}
                       className={process === "email" ? styles["log-input"] : styles["log-pass"]}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="email"
                       placeholder="enter your email address" onChange={(e) => {
                    dispatch({error: null})
                    setEmail(e.currentTarget.value)
                }}/>
                <input className={process === "password" ? styles["log-input"] : styles["log-pass"]}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="password"
                       placeholder="enter your password" onChange={(e) => {
                    dispatch({error: null})
                    setPass(e.currentTarget.value)
                }}/>
            </div>
            {process !== 'reset' ?
                <div className={styles["submit-width"]}>
                    <button
                        className={styles["log-submit"]}
                        type="button"
                        style={{width: "100%"}}
                        onClick={submit}
                    >
                        Submit
                    </button>
                </div> : null
            }

            {error === 'Incorrect password' ? <div className={styles["submit-width"]}>
                <div className={styles.fp} onClick={handleForgotPassword}>forgot password?</div>
            </div> : null}
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
    const [cPass, setCPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const {emailError, passError} = useRecoilValue(AuthErrors);
    const {auth, setAuth, authError, valid} = useAuth();

    const submit = async () => {
        if (email !== '' && pass !== '' && auth !== '' && !emailError && !passError && !authError)
            dispatch({
                error: await signUp(email, pass, auth)
            });
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
            dispatch({error: 'Passwords do not match'});
            setCPass(true);
        } else {
            dispatch({error: null});
            setCPass(false);
        }
    }, [confirmPass])

    useEventListener('keyup', async event => {
        if (event.code === 'Enter')
            await submit();
    })

    return (
        <>
            <div className={styles["create-flex"]}>
                <div className={styles["create-holders"]}>
                    <label htmlFor="authKey">auth key</label>
                    <br/>
                    <input maxLength={24} type="text"
                           style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
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

function AuthKey() {
    const {updateUser} = useUser();
    const dispatch = useSetRecoilState(AuthContextHandler);
    const {auth, setAuth, authError, valid} = useAuth();

    const submit = () => {
        if (auth !== '' && !authError && valid) {
            dispatch({fade: true});
            setTimeout(async () => {
                dispatch({
                    error: await updateUser(auth)
                });
            }, 500)
        }
    }

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            submit();
    })

    useEffect(() => {
        dispatch({fade: false});
    }, [])

    return (
        <>
            <div className={styles["log-input-holder"]}>
                <input
                    className={styles["log-input"]}
                    style={valid ? {borderColor: "#3cab66d0"} : authError ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                    type="text" maxLength={24}
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
    )
}

function Pick() {
    const {connected, signOauth, connect, disconnect} = useUser()
    const dispatch = useSetRecoilState(AuthContextHandler);

    const handleClick = () => {
        dispatch({fade: true});
        setTimeout(() => {
            dispatch({process: "email"});
        }, 500);
    }

    const handleClickOauth = (provider: Provider) => {
        dispatch({fade: true});
        setTimeout(async () => {
            await signOauth(provider);
        }, 500);
    }

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [])

    useEventListener('visibilitychange', event => {
        if (!event.srcElement.hidden && !connected) {
            dispatch({fade: false});
            connect();
        }
    })

    return (
        <>
            <div style={{marginTop: '50px'}}>
                <div className={styles.pick} onClick={() => handleClickOauth('facebook')}
                     style={{background: 'rgba(66, 103, 178, 0.5)', color: 'rgba(255, 255, 255, 0.9)'}}>
                    <div className={styles.pickImg}><Image src={facebook} alt="facebook"/></div>
                    sign in with facebook
                </div>

                <div className={styles.pick} onClick={() => handleClickOauth('google')}
                     style={{background: 'rgba(255, 255, 255, 0.7)', color: 'rgba(1, 16, 28, 0.8)'}}>
                    <div className={styles.pickImg}><Image src={googleLogo} alt="google"/></div>
                    sign in with google
                </div>

                <div className={styles.pick} style={{marginBottom: '0'}} onClick={handleClick}>
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                    </svg>
                    sign in with email
                </div>
            </div>
        </>
    )
}

export default function LoginForm() {
    const reset = useReset();
    const {error, process, fade} = useRecoilValue(AuthContextHandler);

    useEffect(() => {
        return () => reset();
    }, [])

    const handleProcess = (process: Process | undefined) => {
        switch (process) {
            case "email":
                return 'email address';
            case "authKey":
                return 'enter an auth key';
            case "password":
                return 'enter password';
            case "create":
                return "create an account, it's free!";
            case "reset":
                return "please visit your email to reset your password";
            case "pick":
                return "select sign in options";
        }
    }

    return (
        <div className={styles['login-container']}>
            <div
                className={process === "create" ? fade ? `${styles.fade_input} ${styles["create-acc-div"]}` : styles["create-acc-div"] : fade ? `${styles.fade_input} ${styles["log-input-div"]}` : styles["log-input-div"]}>
                <div className={styles["log-label-div"]} style={error ? {color: "rgba(245, 78, 78, .9)"} : {}}>
                    {error ? error : handleProcess(process)}
                </div>
                {process === 'pick' ? <Pick/> : process === "create" ? <Create/> : process === "authKey" ? <AuthKey/> :
                    <Login/>}
            </div>
        </div>
    )
}
