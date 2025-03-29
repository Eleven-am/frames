import { useCallback, FormEvent, useRef } from 'react';

import { FaChevronDown } from 'react-icons/fa6';

import { buildButtonClass, ButtonType } from '@/components/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/table/select';
import { tw } from '@/utils/style';


export interface ItemProps<DataType> {
    value: DataType;
    label: string;
}

interface DropdownProps<DataType> {
    value: ItemProps<DataType>;
    options: ItemProps<DataType>[];
    onChange: (value: DataType) => void;
    className?: string;
    svgClassName?: string;
    selectClassName?: string;
    light?: boolean;
    primary?: boolean;
    noTransition?: boolean;
    hideArrow?: boolean;
}

interface FramesSelectProps<DataType extends string> {
    options: DataType[];
    value: DataType;
    className?: string;
    onChange: (value: DataType) => void;
}

export function Dropdown<DataType> (props: DropdownProps<DataType>) {
    const selectRef = useRef<HTMLSelectElement>(null);
    const handleChange = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const value = event.currentTarget.value;
        const option = props.options.find((option) => option.label === value);

        if (option) {
            props.onChange(option.value);
        }
    }, [props]);

    return (
        <div
            className={tw(buildButtonClass(props.light ? ButtonType.Light : ButtonType.Dark, true, props.noTransition), props.className)}
        >
            <select
                ref={selectRef}
                onChange={handleChange}
                value={props.value.label}
                className={tw('appearance-none bg-transparent border-none w-full focus:outline-none focus:ring-0 px-2', props.selectClassName)}
            >
                {
                    props.options.map((option) => (
                        <option
                            key={option.label}
                            value={option.label}
                        >
                            {option.label}
                        </option>
                    ))
                }
            </select>
            {
                !props.hideArrow && (
                    <FaChevronDown className={tw('h-5 w-5 pr-2 ipadMini:pr-0 float-right pointer-events-none', props.svgClassName)} />
                )
            }
        </div>
    );
}

export function FramesSelect<DataType extends string> (props: FramesSelectProps<DataType>) {
    return (
        <Select
            value={props.value}
            onValueChange={props.onChange}
        >
            <SelectTrigger className={tw('h-8 w-28', props.className)}>
                <SelectValue placeholder={props.value} />
            </SelectTrigger>
            <SelectContent side="top" className={'text-lightest/80'}>
                {
                    props.options.map((role) => (
                        <SelectItem key={role} value={role}>
                            {role}
                        </SelectItem>
                    ))
                }
            </SelectContent>
        </Select>
    );
}

