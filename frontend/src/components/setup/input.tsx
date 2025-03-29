import { AuthButton } from '@/components/auth/buttons';
import { ProcessForm } from '@/components/processForm';
import { useTimer } from '@/hooks/useIntervals';
import { tw } from '@/utils/style';
import { AnimatePresence } from 'framer-motion';
import { useState, useCallback, ChangeEvent, useMemo } from 'react';


export type ObjectToItemArray<T extends Record<string, string>> = {
    [K in keyof T]: {
        name: K;
        maxLength?: number;
        placeholder: string;
        isPassword?: boolean;
        isValueValid?: boolean;
        validate?: (value: string) => Promise<boolean> | boolean;
    };
}[keyof T][];

interface SubmitButtonProps {
    label: string;
    tooltip: string;
    isDisabled: boolean;
}

interface InputGroupProps<T extends Record<string, string>> {
    label: string;
    description: string;
    noAnimationOnEnter?: boolean;
    inputs: ObjectToItemArray<T>;
    submitButton?: SubmitButtonProps;
    handleSubmit: (value: T) => Promise<void> | void;
}

interface InputProps {
    name: string;
    isLast: boolean;
    maxLength?: number;
    placeholder: string;
    isPassword?: boolean;
    isValueValid?: boolean;
    validate?: (value: string) => Promise<boolean> | boolean;
    onValid: (value: string | undefined) => void;
}

function Input ({ placeholder, validate, onValid, isPassword, isLast, isValueValid, maxLength }: InputProps) {
    const { start, stop } = useTimer();
    const [value, setValue] = useState('');
    const [failed, setFailed] = useState(false);

    const handleChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        if (validate) {
            const valid = await validate(event.target.value);

            if (!valid) {
                setFailed(true);

                onValid(undefined);
                return;
            }
        }

        setFailed(false);
        onValid(event.target.value);
    }, [start, stop]);

    return (
        <>
            <div
                className={
                    tw('flex w-full px-4 items-center justify-between bg-lightL/20', {
                        'bg-red-400/20': failed,
                        'bg-green-400/20': isValueValid && value,
                    })
                }
            >
                <input
                    value={value}
                    maxLength={maxLength}
                    onChange={handleChange}
                    placeholder={placeholder}
                    type={isPassword ? 'password' : 'text'}
                    className={'h-12 bg-transparent text-lightest text-xl font-semibold focus:outline-none focus:ring-0'}
                />
            </div>
            {
                !isLast && (
                    <div className={'border-b border-transparent w-full'} />
                )
            }
        </>
    );
}

export function InputGroup<T extends Record<string, string>> ({ label, description, inputs, handleSubmit, submitButton, noAnimationOnEnter = false }: InputGroupProps<T>) {
    const [finalValue, setFinalValue] = useState<T>({
    } as T);

    const onValid = useCallback((name: string) => (value: string | undefined) => {
        setFinalValue((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const disabled = useMemo(() => Object
        .keys(finalValue).length !== inputs.length ||
        Object
            .values(finalValue)
            .some((value) => !value), [finalValue, inputs]);

    const handleClick = useCallback(async () => {
        if (disabled) {
            return;
        }

        await handleSubmit(finalValue);
    }, [disabled, finalValue, handleSubmit]);

    return (
        <AnimatePresence initial={!noAnimationOnEnter}>
            <ProcessForm.Item
                hideForm
                handleSubmit={handleClick}
            >
                <div className="w-full h-full flex flex-col items-center px-4 justify-center gap-y-4">
                    <div className={'w-full flex items-center justify-start pt-8 px-2'}>
                        <h2 className={'text-lightest text-shadow-sm text-2xl fullHD:text-4xl font-bold'}>
                            {label}
                        </h2>
                    </div>
                    <div className={'w-full max-h-full overflow-y-scroll rounded-xl overflow-hidden scrollbar-hide'}>
                        {
                            (inputs || []).map((input, index) => (
                                <Input
                                    {...input}
                                    key={input.placeholder}
                                    name={input.name as string}
                                    onValid={onValid(input.name as string)}
                                    isLast={index === inputs!.length - 1}
                                />
                            ))
                        }
                    </div>
                    <AuthButton
                        type={'submit'}
                        disabled={submitButton?.isDisabled || disabled}
                        className={'text-sm text-gray-400 hover:text-gray-300 bg-darkM hover:bg-darkM/90'}
                        label={submitButton?.label || 'submit'}
                        tooltip={submitButton?.tooltip || 'submit'}
                        handleClick={handleClick}
                    />
                    <p className={'text-lightest/50 px-2 text-xs w-full'}>
                        {description}
                    </p>
                </div>
            </ProcessForm.Item>
        </AnimatePresence>
    );
}
