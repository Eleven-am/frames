import { HTMLAttributes, ReactNode, KeyboardEvent, useCallback, useRef, useState, ChangeEvent } from 'react';

import { FaCirclePlus } from 'react-icons/fa6';

import { BaseButton } from '@/components/button';
import { tw } from '@/utils/style';


interface InputProps {
    label: string;
    startValue?: string;
    onCreate: (value: string) => void;
}

export interface SegmentProps extends HTMLAttributes<HTMLDivElement> {
    isLast?: boolean;
}

export function Segment ({ children, isLast, className, ...rest }: SegmentProps) {
    return (
        <>
            <div
                {...rest}
                className={tw('flex items-center shadow-sm w-full h-12 bg-lightL/20 px-4', className)}
            >
                {children}
            </div>
            {
                !isLast && (
                    <div className={'border-b border-transparent w-full'} />
                )
            }
        </>
    );
}

function Container ({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={tw('w-full max-h-full overflow-y-scroll rounded-xl scrollbar-hide', className)}>
            {children}
        </div>
    );
}

Segment.Container = Container;

function FlexWrapper ({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={tw('flex flex-col grow w-full', className)}>
            {children}
        </div>
    );
}

Segment.FlexWrapper = FlexWrapper;

function Label ({ label }: { label?: string }) {
    if (!label) {
        return null;
    }

    return (
        <div className={'w-full flex items-center justify-start pt-8 px-2 text-lightest shadow-black text-shadow-md'}>
            <h2 className={'text-shadow-sm text-2xl fullHD:text-4xl font-bold'}>
                {label}
            </h2>
        </div>
    );
}

Segment.Label = Label;

function Description ({ description }: { description?: string }) {
    if (!description) {
        return null;
    }

    return (
        <p className={'mt-4 px-2 text-xs w-full text-lightest/50'}>
            {description}
        </p>
    );
}

Segment.Description = Description;

function Section ({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={tw('w-full max-h-full flex flex-col items-center px-4 justify-start gap-y-4 text-lightest text-lg fullHD:text-xl', className)}>
            {children}
        </div>
    );
}

Segment.Section = Section;

function Input ({ label, startValue = '', onCreate }: InputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(startValue);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value), []);

    const handleSpaceKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.code === 'Space') {
            e.stopPropagation();
        }
    }, []);

    const handleCreate = useCallback(() => {
        onCreate(value);
        setValue('');
    }, [onCreate, value]);

    return (
        <Segment.Container>
            <Segment className={'justify-between'}>
                <input
                    value={value}
                    ref={inputRef}
                    placeholder={label}
                    onChange={handleChange}
                    onKeyDown={handleSpaceKeyUp}
                    className={'h-12 flex-grow bg-transparent text-lightest text-xl font-semibold focus:outline-none focus:ring-0'}
                />
                <BaseButton
                    className={'ml-2'}
                    onClick={handleCreate}
                    title={`Create ${value}`}
                >
                    <FaCirclePlus className={'w-6 h-6 text-lightest cursor-pointer'} />
                </BaseButton>
            </Segment>
        </Segment.Container>
    );
}

Segment.Input = Input;
