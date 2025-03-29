import { ReactNode, useMemo, useCallback } from 'react';

import { KeyOf } from '@eleven-am/fp';

import { BaseButton, DropDownButton, DropdownMenu, DropdownContent } from '@/components/button';
import { BaseInput } from '@/components/input';
import { tw } from '@/utils/style';


export interface MoreOptions<TData> extends Omit<DropdownContent, 'onClick'> {
    onClick: (data: TData[]) => void;
}

export interface ColumnFilter<TData, key extends KeyOf<TData>> {
    id: string;
    value: TData[key][];
}

export interface FilterOption<TData, key extends KeyOf<TData>> {
    Component: ReactNode;
    value: TData[key];
}

interface DataTableHeaderProps<TData, key extends KeyOf<TData>> {
    columnKey: key;
    search: string;
    selected: TData[];
    elements: MoreOptions<TData>[];
    setSearch: (search: string) => void;
    filters: FilterOption<TData, key>[];
    columns: ColumnFilter<TData, key>[];
    onDeletion?: (selected: TData[]) => void;
    setSelected: (values: Record<string, boolean>) => void;
    setColumnFilters: (state: (prev: ColumnFilter<TData, key>[]) => ColumnFilter<TData, key>[]) => void;
}

interface FilterButtonProps<TData, key extends KeyOf<TData>> {
    columnKey: key;
    filters: ColumnFilter<TData, key>[];
    options: FilterOption<TData, key>[];
    setColumnFilters: (state: (prev: ColumnFilter<TData, key>[]) => ColumnFilter<TData, key>[]) => void;
}

function modifyFilter<TData, key extends KeyOf<TData>> (prev: ColumnFilter<TData, key>[], key: key, value: TData[key]): ColumnFilter<TData, key>[] {
    const item = prev.find((item) => item.id === key);

    if (!item) {
        return [
            ...prev, {
                id: key as string,
                value: [value],
            },
        ];
    }

    const values = item.value;
    const prevWithoutItem = prev.filter((item) => item.id !== key);

    if (values.includes(value)) {
        return [
            ...prevWithoutItem, {
                ...item,
                value: values.filter((val) => val !== value),
            },
        ];
    }

    return [
        ...prevWithoutItem, {
            ...item,
            value: [...values, value],
        },
    ];
}

function FilterButton <TData, key extends KeyOf<TData>> ({ options, columnKey, filters, setColumnFilters }: FilterButtonProps<TData, key>) {
    const columns = useMemo(() => filters.find((filter) => filter.id === columnKey)?.value || [], [columnKey, filters]);

    const handleClick = useCallback((value: TData[key]) => {
        setColumnFilters((prev) => modifyFilter(prev, columnKey, value));
    }, [columnKey, setColumnFilters]);

    const elements = useMemo((): DropdownContent[] => options.map(({ Component, value }) => ({
        key: value as unknown as string,
        active: columns.includes(value),
        onClick: () => handleClick(value),
        title: value as unknown as string,
        Component,
    })), [columns, handleClick, options]);

    if (!elements.length) {
        return null;
    }

    return (
        <DropDownButton
            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-darkD/70 hover:bg-darkM/70'}
            Content={<span>filter</span>}
        >
            <DropdownMenu title={'filter by'} elements={elements} />
        </DropDownButton>
    );
}

export function DataTableHeader<TData, Key extends KeyOf<TData>> ({ search, setSearch, selected, filters, columns, setColumnFilters, setSelected, columnKey, elements, onDeletion }: DataTableHeaderProps<TData, Key>) {
    const newElements = useMemo(() => elements.map((element) => ({
        ...element,
        onClick: () => element.onClick(selected),
    })), [elements, selected]);

    const handleDeletion = useCallback(() => {
        onDeletion?.(selected);
        setSelected({
        });
    }, [onDeletion, selected, setSelected]);

    return (
        <div className={'flex items-center h-12 mt-2 gap-x-4'}>
            <BaseInput
                className={'h-8 w-96'}
                holderClassName={'items-center macbook:mb-0'}
                onChange={setSearch}
                placeholder={'Search'}
                value={search}
            />
            <FilterButton options={filters} filters={columns} setColumnFilters={setColumnFilters} columnKey={columnKey} />
            <div
                className={
                    tw('gap-x-3 h-full items-center justify-end flex-1 text-sm text-nowrap font-semibold flex', {
                        'opacity-0': !selected.length,
                    })
                }
            >
                {
                    Boolean(newElements.length) && (
                        <DropDownButton
                            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-darkD/70 hover:bg-darkM/70'}
                            Content={<span>more</span>}
                        >
                            <DropdownMenu elements={newElements} />
                        </DropDownButton>
                    )
                }
                {
                    Boolean(onDeletion) && (
                        <BaseButton
                            onClick={handleDeletion}
                            title={'Delete selected'}
                            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-red-600 hover:bg-red-500'}
                        >
                            <span>delete</span>
                        </BaseButton>
                    )
                }
            </div>
        </div>
    );
}
