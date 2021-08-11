import {atom, selector, DefaultValue, useResetRecoilState} from 'recoil';
import NProgress from "nprogress";

export const AuthContextErrorAtom = atom<string | null>({
    key: 'AuthContextErrorAtom',
    default: null
})

type Process = 'pick' | 'email' | 'password' | 'create';

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

export const AuthPicker = atom<boolean>({
    key: 'AuthPicker',
    default: true
})

export const AuthContextHandler = selector<{fade?: boolean, process?: Process, error?: string | null }>({
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
            fade: error ? false: get(AuthFade),
            process: get(AuthContextProcessAtom),
            error: newError === '' ? error: newError
        }
    }, set: ({set, get}, newValue) => {
        if (!(newValue instanceof DefaultValue)) {
            newValue.process && NProgress.start();
            if (newValue.fade !== undefined) {
                set(AuthFade, newValue.fade);
                NProgress.done();
            }

            if (newValue.process && newValue.error) {
                set(AuthContextErrorAtom, newValue.error);
                set(AuthContextProcessAtom, newValue.process);
            }

            else if (newValue.process ) {
                set(AuthContextErrorAtom, null);
                set(AuthContextProcessAtom, newValue.process);
            }

            else if (newValue.error)
                set(AuthContextErrorAtom, newValue.error);
        }
    }
})

const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email === '' ? true: re.test(email);
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
    let result = false;
    let rgx = new RegExp(/^[A-Za-z0-9]{1,5}$/);
    let nonRgx = new RegExp(/[$-/:-?{-~!"^_`\[\]\s+]/);

    if (key === '' || key === 'homeBase')
        result = true;

    else if ((key.length % 6 === 0 && key.charAt(key.length - 1) === "-") || key.length > 6) {
        let matches = key.split('-').filter(e => e !== '');
        result = matches.every(match => rgx.test(match) && !nonRgx.test(match));

    } else if (key.length < 6)
        result = rgx.test(key) && !nonRgx.test(key);

    return result;
}

export const AuthErrors = selector({
    key: 'AuthErrors',
    get: ({get}) =>  {
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
    const picker = useResetRecoilState(AuthPicker);

    return () => {
        error();
        process();
        email();
        password();
        fade();
        authKey();
        picker();
    }
}