import { HiOutlineMail } from 'react-icons/hi';
import { IoKeyOutline } from 'react-icons/io5';
import { LuEyeOff, LuEye } from 'react-icons/lu';

import { BaseInput } from '@/components/input';
import { useAuthStoreActions, useAuthStore, AuthProcess } from '@/providers/authStore';
import { tw } from '@/utils/style';


interface InputProps {
    name: string;
    placeholder: string;
    maxLength?: number;
    value?: string;
    defaultValue?: string;
    readonly?: boolean;
    ignoreCheck?: boolean;
}

interface PasswordInputProps extends InputProps {
    confirmPassword?: boolean;
}

export function EmailInput (props: InputProps) {
    const { setEmail } = useAuthStoreActions();
    const { email, error } = useAuthStore((state) => state.email);

    return (
        <BaseInput
            {...props}
            value={email}
            type={'email'}
            iconPosition="left"
            onChange={setEmail}
            autoComplete={'email'}
            isValueInvalid={Boolean(error)}
            icon={<HiOutlineMail className="w-5 h-5 text-lightest dark:text-gray-400" />}
        />
    );
}

export function PasswordInput ({ confirmPassword, ...props }: PasswordInputProps) {
    const processIsPassword = useAuthStore((state) => state.process === AuthProcess.Password);
    const { setPassword, setPasswordConfirm, togglePasswordConfirmVisibility, togglePasswordVisibility } = useAuthStoreActions();
    const { password, error, passwordVisible, passwordConfirm, passwordConfirmVisible, passwordConfirmValid, passwordValid } = useAuthStore((state) => state.password);

    return (
        <BaseInput
            {...props}
            value={confirmPassword ? passwordConfirm : password}
            type={confirmPassword ? (passwordConfirmVisible ? 'text' : 'password') : (passwordVisible ? 'text' : 'password')}
            iconClassName={'text-sm leading-5 cursor-pointer'}
            iconPosition="right"
            onChange={confirmPassword ? setPasswordConfirm : setPassword}
            autoComplete={'current-password'}
            isValueInvalid={Boolean(error)}
            isValueValid={processIsPassword ? false : confirmPassword ? passwordConfirmValid : passwordValid}
            onIconClick={confirmPassword ? togglePasswordConfirmVisibility : togglePasswordVisibility}
            icon={
                <>
                    {
                        confirmPassword ?
                            passwordConfirmVisible ?
                                <LuEyeOff className="w-5 h-5 text-lightest dark:text-gray-400" /> :
                                <LuEye className="w-5 h-5 text-lightest dark:text-gray-400" /> :
                            passwordVisible ?
                                <LuEyeOff className="w-5 h-5 text-lightest dark:text-gray-400" /> :
                                <LuEye className="w-5 h-5 text-lightest dark:text-gray-400" />
                    }
                </>
            }
        />
    );
}

export function AuthKeyInput (props: InputProps) {
    const { setAuthKey } = useAuthStoreActions();
    const { authKey, authKeyValid, readonly, error } = useAuthStore((state) => state.authKey);

    return (
        <BaseInput
            {...props}
            value={authKey}
            type={readonly ? 'password' : 'text'}
            maxLength={24}
            onChange={setAuthKey}
            isValueInvalid={Boolean(error)}
            isValueValid={authKeyValid}
            icon={
                <IoKeyOutline
                    className={
                        tw('w-5 h-5 text-lightest dark:text-gray-400', {
                            'text-red-500': error,
                            'text-green-500': authKeyValid,
                        })
                    }
                />
            }
        />
    );
}

export function UsernameInput (props: InputProps) {
    const { setUsername } = useAuthStoreActions();
    const { username, error, available } = useAuthStore((state) => state.username);

    return (
        <BaseInput
            {...props}
            value={username}
            type={'text'}
            isValueValid={available}
            onChange={setUsername(props.ignoreCheck)}
            isValueInvalid={Boolean(error)}
        />
    );
}
