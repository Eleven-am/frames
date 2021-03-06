import {atom, DefaultValue, selector, useResetRecoilState} from 'recoil';
import NProgress from "nprogress";

export const AuthContextErrorAtom = atom<string | null>({
    key: 'AuthContextErrorAtom',
    default: null
})

export type Process = 'pick' | 'email' | 'password' | 'create' | 'authKey' | 'reset';

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

export const Authenticated = atom<boolean | null>({
    key: 'AuthenticatedAtom',
    default: null
})

export const AuthContextHandler = selector<{ fade?: boolean, process?: Process, error?: string | null }>({
    key: 'AuthContextHandler',
    get: ({get}) => {
        const errors = get(AuthErrors);
        const error = get(AuthContextErrorAtom);
        let newError: string = '';

        if (errors.emailError)
            newError = 'enter a valid email address';

        else if (errors.passError)
            newError = 'Password must contain a number, a capital and a small letter';

        else if (errors.authError)
            newError = 'invalid auth key';

        return {
            fade: error ? false : get(AuthFade),
            process: get(AuthContextProcessAtom),
            error: newError === '' ? error : newError
        }
    }, set: ({set, get}, newValue) => {
        const auth = get(Authenticated);
        if (!(newValue instanceof DefaultValue)) {
            newValue.process && NProgress.start();
            if (newValue.process && auth)
                set(AuthContextProcessAtom, newValue.process);

            if (newValue.error !== undefined)
                set(AuthContextErrorAtom, newValue.error);

            if (newValue.fade !== undefined && auth) {
                set(AuthFade, newValue.fade);
                NProgress.done();
            }
        }
    }
})

const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email === '' ? true : re.test(email);
};

const validatePass = (pass: string) => {
    if (pass === '')
        return true;

    else if (pass.length < 4)
        return false;

    else if (!/\d/.test(pass))
        return false;

    else if (!/[a-z]/.test(pass))
        return false;

    else return /[A-Z]/.test(pass);
}

const confirmAuth = (key: string) => {
    let rgx = new RegExp(/^[A-Za-z0-9]{1,4}$/);
    let nonRgx = new RegExp(/[$-/:-?{-~!"^_`\[\]\s+]/);

    if (key === '')
        return true;

    else if (key.length > 4) {
        let matches = key.split('-').filter(e => e !== '');
        return matches.every(match => rgx.test(match) && !nonRgx.test(match));

    } else return rgx.test(key) && !nonRgx.test(key);
}

export const AuthErrors = selector({
    key: 'AuthErrors',
    get: ({get}) => {
        const email = get(AuthContextEmailAtom);
        const pass = get(AuthContextPasswordAtom);
        const auth = get(AuthKeyAtom);

        return {authError: !confirmAuth(auth), passError: !validatePass(pass), emailError: !validateEmail(email)}
    }
})

export const useReset = () => {
    const error = useResetRecoilState(AuthContextErrorAtom);
    const process = useResetRecoilState(AuthContextProcessAtom);
    const email = useResetRecoilState(AuthContextEmailAtom);
    const password = useResetRecoilState(AuthContextPasswordAtom);
    const fade = useResetRecoilState(AuthFade);
    const authKey = useResetRecoilState(AuthKeyAtom);
    const auth = useResetRecoilState(Authenticated);

    return () => {
        auth();
        error();
        process();
        email();
        password();
        fade();
        authKey();
    }
}