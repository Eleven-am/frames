import {
    atom,
    DefaultValue,
    selector,
    useRecoilState,
    useRecoilValue,
    useResetRecoilState,
    useSetRecoilState
} from 'recoil';
import NProgress from "nprogress";
import {Role} from "@prisma/client";
import {useCallback, useEffect, useState} from "react";
import useUser from "../../../utils/user";
import {subscribe} from "../../../utils/customHooks";
import {AuthCP} from "../../../../server/classes/middleware";

export const AuthContextErrorAtom = atom<string | null>({
    key: 'AuthContextErrorAtom',
    default: null
})

export type Process = 'pick' | 'email' | 'password' | 'create' | 'authKey' | 'reset' | 'resetPassword' | 'verify';

export const AuthContextProcessAtom = atom<Process>({
    key: 'AuthContextProcessAtom',
    default: 'pick'
})

export const AuthContextEmailAtom = atom<string>({
    key: 'AuthContextEmailAtom',
    default: ''
})

export const AuthContextPasswordAtom = atom<string>({
    key: 'AuthContextPasswordAtom',
    default: ''
})

export const AuthKeyAtom = atom<string>({
    key: 'AuthKeyAtom',
    default: ''
})

export const AuthFade = atom<boolean>({
    key: 'AuthFade',
    default: false
})

export const Authenticated = atom<AuthCP | null>({
    key: 'AuthenticatedAtom',
    default: null
})

export const AuthContextHandler = selector<{ fade?: boolean, process?: Process, error?: string | null }>({
    key: 'AuthContextHandler',
    get: ({get}) => {
        const errors = get(AuthErrors);
        const error = get(AuthContextErrorAtom);
        let newError = '';

        if (errors.emailError)
            newError = 'enter a valid email address';

        else if (errors.passError)
            newError = 'Password must contain a number, a capital letter, a small letter and must be at least 8 characters long';

        else if (errors.authError)
            newError = 'invalid auth key';

        return {
            fade: error ? false : get(AuthFade),
            process: get(AuthContextProcessAtom),
            error: newError === '' ? error : newError
        }
    }, set: ({set, get}, newValue) => {
        const auth = get(Authenticated)?.authentication || false;
        if (!(newValue instanceof DefaultValue)) {
            if (newValue.process && auth) {
                NProgress.start();
                set(AuthContextProcessAtom, newValue.process);
            }

            if (newValue.error !== undefined)
                set(AuthContextErrorAtom, newValue.error);

            if (newValue.fade !== undefined && auth) {
                set(AuthFade, newValue.fade);
                NProgress.done();
            }
        }
    }
})

export const AuthErrors = selector({
    key: 'AuthErrors',
    get: ({get}) => {
        const email = get(AuthContextEmailAtom);
        const pass = get(AuthContextPasswordAtom);
        const auth = get(AuthKeyAtom);

        return {authError: !confirmAuth(auth), passError: !validatePass(pass), emailError: !validateEmail(email)}
    }
})

const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/;
    return email === '' ? true : re.test(email);
};

const validatePass = (pass: string) => {
    if (pass === '')
        return true;

    else if (pass.length < 8)
        return false;

    else if (!/\d/.test(pass))
        return false;

    else if (!/[a-z]/.test(pass))
        return false;

    else return /[A-Z]/.test(pass);
};

const confirmAuth = (key: string) => {
    let rgx = new RegExp(/^[A-Za-z\d]{1,4}$/);
    let nonRgx = new RegExp(/[$-/:-?{-~!"^_`\[\]\s+]/);

    if (key === '')
        return true;

    else if (key.length > 4) {
        let matches = key.split('-').filter(e => e !== '');
        return matches.every(match => rgx.test(match) && !nonRgx.test(match));

    } else return rgx.test(key) && !nonRgx.test(key);
};

export const useReset = () => {
    const error = useResetRecoilState(AuthContextErrorAtom);
    const process = useResetRecoilState(AuthContextProcessAtom);
    const email = useResetRecoilState(AuthContextEmailAtom);
    const password = useResetRecoilState(AuthContextPasswordAtom);
    const fade = useResetRecoilState(AuthFade);
    const authKey = useResetRecoilState(AuthKeyAtom);

    return () => {
        error();
        process();
        email();
        password();
        fade();
        authKey();
    }
};

export function useAuth() {
    const {user, confirmAuthKey} = useUser();
    const [lAuth, setLAuth] = useState(false);
    const [valid, setValid] = useState(false);
    const [auth, setAuth] = useRecoilState(AuthKeyAtom);
    const {authError} = useRecoilValue(AuthErrors);
    const {error} = useRecoilValue(AuthContextHandler);
    const setError = useSetRecoilState(AuthContextErrorAtom);

    const confirmKey = useCallback(async () => {
        const res = await confirmAuthKey(auth);
        if (res !== 0) {
            const error = res === -1 ? 'invalid auth key' : 'this auth key has already been used';
            setError(error);
            setLAuth(true);

        } else {
            setValid(true);
            setError(null);
            setLAuth(false);
        }
    }, [auth, confirmAuthKey, setError]);

    const manageAuth = useCallback(async (auth: string) => {
        if (auth.length === 24)
            await confirmKey();

        else if (auth === 'homeBase') {
            if (user?.role === Role.ADMIN) {
                setError(null);
                setLAuth(false);
                setValid(true);

            } else {
                setError('invalid auth key')
                setLAuth(true);
                setValid(false);
            }
        } else {
            setError(null);
            setLAuth(false);
            setValid(false);
        }
    }, [auth, confirmKey, user]);

    subscribe(manageAuth, auth);

    return {authError: authError || lAuth, auth, setAuth, valid, error}
}

export function usePassword() {
    const {passError} = useRecoilValue(AuthErrors);
    const [pass, setPass] = useRecoilState(AuthContextPasswordAtom);
    const [cPass, setCPass] = useState(false);
    const [passValid, setPassValid] = useState(false);
    const dispatch = useSetRecoilState(AuthContextHandler);
    const [confirmPass, setConfirmPass] = useState('');

    useEffect(() => {
        if (confirmPass !== pass && confirmPass !== '') {
            dispatch({error: 'Passwords do not match'});
            setCPass(true);
        } else {
            dispatch({error: null});
            setCPass(false);
            if (pass !== '' && !passError)
                setPassValid(true);
            else
                setPassValid(false);
        }
    }, [confirmPass])

    return {passError, pass, setPass, valid: cPass, confirmPass, setConfirmPass, passValid}
}

export function useEmail(confirmEmail = false) {
    const [isValid, setIsValid] = useState(false);
    const [validating, setValidating] = useState(true);
    const [email, setEmail] = useRecoilState(AuthContextEmailAtom);
    const {emailError} = useRecoilValue(AuthErrors);
    const {confirmMail} = useUser();

    const confirm = useCallback(async () => {
        if (!emailError)
            if (confirmEmail) {
                setValidating(true);
                const res = await confirmMail(email);
                if (res !== 'create')
                    setIsValid(true);

                else
                    setIsValid(false);

            } else
                setValidating(true);

        else if (email === '')
            setValidating(true);

        else
            setValidating(false);
    }, [email, emailError, confirmMail]);

    subscribe(confirm, {confirmEmail, emailError, email})

    return {isValid, validating, email, setEmail}
}
