import React, {useCallback, useEffect, useRef, useState} from "react";
import styles from './Auth.module.css';
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import googleLogo from '../../assets/ggl.png';
import facebook from '../../assets/fb.png';
import Image from "next/image";
import {
    AuthContextEmailAtom,
    AuthContextHandler,
    AuthErrors,
    AuthFade,
    Process,
    useAuth,
    useEmail,
    usePassword,
    useReset
} from "./authContext";
import {subscribe, useEventListener} from "../../../utils/customHooks";
import useUser, {Provider} from "../../../utils/user";

function Login() {
    const [state, dispatch] = useRecoilState(AuthContextHandler);
    const [email, setEmail] = useRecoilState(AuthContextEmailAtom);
    const [pass, setPass] = useState('');
    const {confirmMail, signIn, forgotPassword} = useUser();
    const {emailError} = useRecoilValue(AuthErrors);
    const {error, process} = state;

    const submit = useCallback(() => {
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
    }, [email, pass, process, confirmMail, signIn, emailError]);

    const handleForgotPassword = useCallback(() => {
        dispatch({fade: true, error: null});
        setTimeout(async () => {
            if (email !== '' && !emailError) {
                const data = await forgotPassword(email);
                if (data && !data.hasOwnProperty('error'))
                    dispatch({process: 'reset'});
                else if (data && typeof data !== 'boolean')
                    dispatch({error: data.error as string});
            } else
                dispatch({error: 'enter a valid email address', process: 'email'});
            fade()
        }, 500)
    }, [email, emailError, forgotPassword]);

    const fade = useCallback(() => setTimeout(() => dispatch({fade: false}), 1000), [dispatch]);

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
                       autoComplete={'on'}
                       className={process === "email" ? styles["log-input"] : styles["log-pass"]}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="email"
                       placeholder="enter your email address" onChange={(e) => {
                    dispatch({error: null})
                    setEmail(e.currentTarget.value)
                }}/>
                <input className={process === "password" ? styles["log-input"] : styles["log-pass"]}
                       autoComplete={'current-password'}
                       readOnly={process !== "password"}
                       style={error ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="password"
                       placeholder="enter your password" onChange={(e) => {
                    dispatch({error: null})
                    setPass(e.currentTarget.value)
                }}/>
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

            {error === 'Incorrect password' ? <div className={styles["submit-width"]}>
                <div className={styles.fp} onClick={handleForgotPassword}>forgot password?</div>
            </div> : null}
        </>
    )
}

function CreateAccount() {
    const submitWidth = useRef<HTMLButtonElement>(null);
    const {signUp} = useUser();
    const dispatch = useSetRecoilState(AuthContextHandler);
    const fade = useRecoilValue(AuthFade);
    const {auth, setAuth, authError, valid} = useAuth();
    const {email, setEmail, isValid, validating} = useEmail(true);
    const {passError, valid: cPass, pass, setPass, setConfirmPass} = usePassword();

    const submit = useCallback(async () => {
        if (email !== '' && pass !== '' && auth !== '' && (!isValid && validating) && !passError && !authError)
            dispatch({
                error: await signUp(email, pass, auth)
            });
    }, [email, pass, auth, isValid, validating, passError, authError, signUp, dispatch]);

    useEffect(() => {
        setTimeout(() => {
            if (fade) {
                dispatch({fade: false});
                if (submitWidth.current)
                    submitWidth.current.style.width = "40%";
            }
        }, 500)
    }, [])

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
                    <input style={!validating || isValid ? {borderColor: "rgba(245, 78, 78, .9)"} : {}} type="text"
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

    const submit = useCallback(() => {
        if (auth !== '' && !authError && valid) {
            dispatch({fade: true});
            setTimeout(async () => {
                dispatch({
                    error: await updateUser(auth)
                });
            }, 500)
        }
    }, [auth, authError, valid])

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
    const {signOauth, windowOpen} = useUser()
    const dispatch = useSetRecoilState(AuthContextHandler);

    const handleClick = useCallback(() => {
        dispatch({fade: true});
        setTimeout(() => {
            dispatch({process: "email"});
        }, 500);
    }, [])

    const handleClickOauth = useCallback((provider: Provider) => {
        dispatch({fade: true});
        setTimeout(async () => {
            await signOauth(provider);
        }, 500);
    }, []);

    subscribe(windowOpen => {
        if (windowOpen)
            dispatch({fade: true});
        else
            dispatch({fade: false});
    }, windowOpen);

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

function ResetPassword() {
    const {modifyPassword} = useUser();
    const dispatch = useSetRecoilState(AuthContextHandler);
    const {passError, valid: cPass, passValid, pass, setPass, setConfirmPass} = usePassword();

    const submit = useCallback(async () => {
        if (passValid) {
            dispatch({fade: true});
            setTimeout(async () => {
                dispatch({
                    error: await modifyPassword(pass),
                })
            }, 500);
        } else dispatch({error: "passwords do not match"});
    }, [modifyPassword, dispatch, passValid, pass]);

    return (
        <>
            <div className={styles.rst}>
                <label htmlFor="create-pass">password</label>
                <br/>
                <input
                    style={passValid ? {borderColor: "#3cab66d0"} : passError || cPass ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                    type="password" placeholder="enter your password"
                    onChange={(e) => setPass(e.currentTarget.value)}/>
                <div className={styles.authSpacers}/>
                <label htmlFor="confirm-pass">confirm password</label>
                <br/>
                <input
                    style={passValid ? {borderColor: "#3cab66d0"} : cPass ? {borderColor: "rgba(245, 78, 78, .9)"} : {}}
                    type="password" placeholder="confirm your password"
                    onChange={(e) => setConfirmPass(e.currentTarget.value)}/>
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

export default function LoginForm() {
    const reset = useReset();
    const {error, process, fade} = useRecoilValue(AuthContextHandler);

    useEffect(() => {
        return () => reset();
    }, [])

    const handleProcess = useCallback((process: Process | undefined) => {
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
            case "verify":
                return "Please check your email for a verification link";
            case "pick":
                return "select sign in options";
            case "resetPassword":
                return "enter your new password";
        }
    }, [])

    return (
        <div className={styles['login-container']}>
            <div
                className={process === "create" ? fade ? `${styles.fade_input} ${styles["create-acc-div"]}` : styles["create-acc-div"] : fade ? `${styles.fade_input} ${styles["log-input-div"]}` : styles["log-input-div"]}>
                <div className={styles["log-label-div"]} style={error ? {color: "rgba(245, 78, 78, .9)"} : {}}>
                    {error ? error : handleProcess(process)}
                </div>
                {process === "pick" && <Pick/>}
                {process === "authKey" && <AuthKey/>}
                {process === "create" && <CreateAccount/>}
                {process === "resetPassword" && <ResetPassword/>}
                {(process === "password" || process === 'email') && <Login/>}
            </div>
        </div>
    )
}
