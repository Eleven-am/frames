import { ForwardedRef,
    ReactNode,
    memo,
    forwardRef,
    useCallback,
    ChangeEvent,
    useMemo,
    useState,
    KeyboardEvent,
    InputHTMLAttributes,
    useEffect } from 'react';

import { FiEdit2 } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';

import { BaseButton } from '@/components/button';
import { tw } from '@/utils/style';


interface TransformingInputProps<T extends 'input' | 'textarea'> {
    ref?: ForwardedRef<HTMLElementTagNameMap[T]>;
    onChange: (value: string) => void;
    onBlur?: (value: string) => void;
    inputClassName?: string;
    iconClassName?: string;
    iconLeft?: boolean;
    className?: string;
    readonly?: boolean;
    rows?: number;
    value: string;
    element: T;
}

interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'readOnly'> {
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    readonly?: boolean;
    onIconClick?: () => void;
    onChange: (value: string) => void;
    isValueValid?: boolean;
    isValueInvalid?: boolean;
    holderClassName?: string;
    iconClassName?: string;
}

interface MultiValueInputProps extends Omit<BaseInputProps, 'onChange' | 'value'> {
    onChange: (value: string[]) => void;
    values: string[];
}

const baseClassName = 'outline-none text-sm ipadPro:text-xl macbook:text:xl rounded-lg block w-full p-2.5 bg-darkL/20';
const className = `${baseClassName} border border-lightL/70 placeholder-lightL/60 text-lightL focus:ring-1 focus:ring-lightL`;
const classNameInvalid = `${baseClassName} border placeholder-red-500 border-red-500 text-red-500`;
const classNameValid = `${baseClassName} border border-green-500 placeholder-green-500 text-green-500`;

export const BaseInput = memo(forwardRef<HTMLInputElement, BaseInputProps>(({ icon, iconPosition, isValueInvalid, isValueValid, iconClassName, holderClassName, onIconClick, ...props }, ref) => {
    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        props.onChange(e.target.value);
    }, [props]);

    const newClassName = useMemo(() => {
        if (isValueInvalid) {
            return classNameInvalid;
        }
        if (isValueValid) {
            return classNameValid;
        }

        return className;
    }, [isValueInvalid, isValueValid]);

    const Icon = useCallback(() => (
        <div onClick={onIconClick}
            className={
                tw('absolute inset-y-0 flex items-center', {
                    'pointer-events-none cursor-default': !onIconClick,
                    'cursor-pointer': onIconClick,
                    'left-0 pl-3': iconPosition === 'left',
                    'right-0 pr-3': iconPosition === 'right',
                }, iconClassName)
            }
        >
            {icon}
        </div>
    ), [onIconClick, iconPosition, iconClassName, icon]);

    return (
        <div className={tw('relative mb-2 macbook:mb-4', holderClassName)}>
            {
                iconPosition === 'left' && (
                    <Icon />
                )
            }
            <input
                {...props}
                ref={ref}
                onChange={onChange}
                readOnly={props.readonly}
                className={
                    tw(newClassName, {
                        'pl-10': iconPosition === 'left',
                        'pr-10': iconPosition === 'right',
                    }, props.className)
                }
            />
            {
                iconPosition === 'right' && (
                    <Icon />
                )
            }
        </div>
    );
}));

export const TransformingInput = memo(forwardRef<HTMLElement, TransformingInputProps<any>>((props, ref) => {
    const [shouldTransform, setShouldTransform] = useState(false);

    const Element = useMemo(() => props.element, [props.element]);

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.onChange(event.target.value), [props]);

    const handleBlur = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        props.onBlur?.(event.target.value);
        setShouldTransform(false);
    }, [props]);

    const handleClick = useCallback(() => setShouldTransform(true), []);

    const hasTransformed = useMemo(() => shouldTransform && !props.readonly, [shouldTransform, props.readonly]);

    return (
        <>
            {
                hasTransformed ?
                    <Element
                        ref={ref as any}
                        value={props.value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={tw('outline-none focus:outline-none bg-transparent', props.className, props.inputClassName)}
                        autoFocus
                        rows={props.rows}
                    />
                    :
                    <div
                        className={
                            tw('relative group cursor-pointer flex justify-between items-center', {
                                'cursor-default': props.readonly,
                            })
                        }
                        onClick={handleClick}
                    >
                        {
                            (!props.readonly && props.iconLeft) && (
                                <FiEdit2
                                    className={tw('opacity-0 group-hover:opacity-100 right-0 w-5 h-5 cursor-pointer -scale-x-100', props.iconClassName)}
                                />
                            )
                        }
                        <span
                            ref={ref}
                            className={tw(props.className)}
                        >
                            {props.value}
                        </span>
                        {
                            (!props.readonly && !props.iconLeft) && (
                                <FiEdit2
                                    className={tw('opacity-0 group-hover:opacity-100 right-0 w-5 h-5 cursor-pointer', props.iconClassName)}
                                />
                            )
                        }
                    </div>
            }
        </>
    );
}));

export const MultiValueInput = memo(forwardRef<HTMLInputElement, MultiValueInputProps>(({
    values, onChange,
    icon, iconPosition,
    isValueInvalid, isValueValid,
    iconClassName, holderClassName, onIconClick,
    ...props
}, ref) => {
    const [valuesState, setValuesState] = useState(values);
    const [typing, setTyping] = useState(false);
    const [value, setValue] = useState('');
    const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

    useEffect(() => setValuesState(values), [values]);

    const handleOnKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const values = new Set(valuesState);

            values.add(value);
            const newValues = Array.from(values);

            setValuesState(newValues);
            setValue('');
            setTyping(false);
            onChange(newValues);

            e.currentTarget.blur();
        }
    }, [onChange, value, valuesState]);

    const removeValue = useCallback((value: string) => () => {
        const newValues = valuesState.filter((val) => val !== value);

        setValuesState(newValues);
        onChange(newValues);
    }, [valuesState, onChange]);

    const Icon = useCallback(() => (
        <div onClick={onIconClick}
            className={
                tw('absolute inset-y-0 flex items-center', {
                    'pointer-events-none cursor-default': !onIconClick,
                    'cursor-pointer': onIconClick,
                    'left-0 pl-3': iconPosition === 'left',
                    'right-0 pr-3': iconPosition === 'right',
                }, iconClassName)
            }
        >
            {icon}
        </div>
    ), [onIconClick, iconPosition, iconClassName, icon]);

    const onChangeValue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setTyping(true);
    }, []);

    const handleTypingState = useCallback((typing: boolean) => () => {
        setTyping(typing);
        if (typing && inputRef) {
            inputRef.focus();
        }
    }, [inputRef]);

    const newClassName = useMemo(() => {
        if (isValueInvalid) {
            return classNameInvalid;
        }
        if (isValueValid) {
            return classNameValid;
        }

        return className;
    }, [isValueInvalid, isValueValid]);

    const refCallback = useCallback((node: HTMLInputElement | null) => {
        if (node) {
            setInputRef(node);
        }

        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    return (
        <div className={tw('relative mb-2 macbook:mb-4', holderClassName)}>
            {
                iconPosition === 'left' && (
                    <Icon />
                )
            }
            <input
                {...props}
                ref={refCallback}
                value={value}
                onKeyDown={handleOnKeyDown}
                onChange={onChangeValue}
                readOnly={props.readonly}
                onBlur={handleTypingState(false)}
                className={
                    tw(newClassName, {
                        'pl-10': iconPosition === 'left',
                        'pr-10': iconPosition === 'right',
                        hidden: !typing && valuesState.length,
                    }, props.className)
                }
            />
            <div
                onClick={handleTypingState(true)}
                className={
                    tw(newClassName, 'flex flex-wrap gap-1', {
                        hidden: !valuesState.length || typing,
                    })
                }
            >
                {
                    valuesState.map((value) => (
                        <div
                            key={value}
                            className={'flex items-center gap-x-1 font-semibold border border-lightest rounded-lg px-2 text-shadow-sm shadow-sm shadow-black'}
                        >
                            <span>{value.length > 10 ? `${value.slice(0, 10)}...` : value}</span>
                            <BaseButton onClick={removeValue(value)} title={`Remove ${value}`}>
                                <IoClose />
                            </BaseButton>
                        </div>
                    ))
                }
            </div>
            {
                iconPosition === 'right' && (
                    <Icon />
                )
            }
        </div>
    );
}));

