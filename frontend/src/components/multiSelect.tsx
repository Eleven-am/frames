import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';

import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { IoCloseOutline } from 'react-icons/io5';

import { BaseButton } from '@/components/button';
import { useFlatList } from '@/hooks/useFlatList';
import { tw } from '@/utils/style';


export interface MultiSelectItem<DataType = unknown> {
    id: string;
    label: string;
    value: DataType;
}

interface MultiSelectProps<DataType> {
    items: MultiSelectItem<DataType>[];
    selectedItems: string[];
    handleItemSelected: (item: MultiSelectItem<DataType>) => void;
    children?: ReactNode;
    mobileLabel: string;
    tags?: boolean;
}

const className = 'h-8 text-sm font-semibold text-lightL py-1 px-4 rounded-lg border border-lightD bg-darkD flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm data-[selected=true]:border-lightest data-[selected=true]:bg-darkM/70 data-[selected=true]:text-lightest hover:border-lightM hover:bg-darkM/70 hover:text-lightest hover:shadow-md hover:shadow-black';

export function MultiSelect<DataType> ({
    items,
    selectedItems,
    handleItemSelected,
    children,
    mobileLabel,
    tags = false,
}: MultiSelectProps<DataType>) {
    const [isOpen, setIsOpen] = useState(false);
    const {
        plugParent,
        plugUlList,
        resetVisibility,
        LeftChevronButton,
        RightChevronButton,
    } = useFlatList({
        skip: 3,
    });

    const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const isItemSelected = useCallback((item: MultiSelectItem<DataType>) => selectedItems.includes(item.id), [selectedItems]);
    const handleClick = useCallback((item: MultiSelectItem<DataType>) => () => handleItemSelected(item), [handleItemSelected]);

    useEffect(() => resetVisibility(), [items, resetVisibility]);

    const newMobileLabel = useMemo(() => {
        const selected = items.filter((item) => isItemSelected(item));

        if (selected.length === 0) {
            return mobileLabel;
        }

        if (selected.length === 1) {
            return selected[0].label;
        }

        return `${selected.length} selected`;
    }, [isItemSelected, items, mobileLabel]);

    return (
        <>
            <div className={'relative hidden ipadMini:flex h-full items-center flex-grow overflow-x-hidden scrollbar-hide p-0'}>
                <LeftChevronButton
                    className={'text-lightL hover:text-lightest stroke-2 w-6 h-6 mr-2 mt-1 cursor-pointer transition-all duration-300 ease-in-out'}
                />
                <div
                    ref={plugParent}
                    className={'flex flex-grow overflow-x-hidden h-full scrollbar-hide mx-4'}
                >
                    <ul
                        className={'flex items-center flex-row justify-start p-0 h-full gap-x-3 text-nowrap'}
                        ref={plugUlList}
                    >
                        {
                            items.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={handleClick(item)}
                                    data-selected={isItemSelected(item)}
                                    className={
                                        tw(className, {
                                            'px-2': tags,
                                        })
                                    }
                                >
                                    <span className={'text-nowrap'}>
                                        {item.label}
                                    </span>
                                    {tags && <IoCloseOutline strokeWidth={2} className={'w-4 h-4 ml-4'} />}
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <RightChevronButton
                    className={'text-lightL hover:text-lightest stroke-2 w-6 h-6 mr-2 mt-1 cursor-pointer transition-all duration-300 ease-in-out'}
                />
            </div>
            <div className={tw(className, 'relative flex ipadMini:hidden flex-grow scrollbar-hide')}>
                <div
                    className={'flex flex-grow overflow-x-hidden scrollbar-hide'}
                    onClick={handleToggle}
                >
                    <span>{newMobileLabel}</span>
                </div>
                <BaseButton
                    onClick={handleToggle}
                    title={'Toggle'}
                    className={'text-lightL hover:text-lightest mr-2 cursor-pointer transition-all duration-300 ease-in-out'}
                >
                    {
                        isOpen
                            ? <FiChevronUp strokeWidth={2} className={'h-5 w-5'} />
                            : <FiChevronDown strokeWidth={2} className={'h-5 w-5'} />
                    }
                </BaseButton>
                {
                    isOpen && (
                        <div className={'absolute mt-12 top-0 left-0 w-full h-96 z-50 shadow-black shadow-lg rounded-lg border border-lightL bg-darkD overflow-y-scroll scrollbar-hide'}>
                            <ul className={'flex flex-col px-2 py-3'}>
                                {
                                    items.map((item) => (
                                        <li
                                            key={item.id}
                                            onClick={handleClick(item)}
                                            data-selected={selectedItems.includes(item.id)}
                                            className={className}
                                            title={item.label}
                                        >
                                            <span className={'w-full line-clamp-1 px-2 text-center'}>
                                                {item.label}
                                            </span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    )
                }
            </div>
            {children}
        </>
    );
}
