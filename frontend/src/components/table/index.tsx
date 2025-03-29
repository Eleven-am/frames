import { useState } from 'react';

import { ColumnDef,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    flexRender } from '@tanstack/react-table';

import { DataTableHeader, FilterOption, ColumnFilter, MoreOptions } from '@/components/table/DataTableHeader';
import { DataTablePagination } from '@/components/table/pagination';
import { TableCell, TableRow, Table, TableHeader, TableHead, TableBody } from '@/components/table/table';


interface DataTableProps<TData, TValue, Key extends keyof TData> {
    data: TData[];
    columnKey: Key;
    elements?: MoreOptions<TData>[];
    columns: ColumnDef<TData, TValue>[];
    filters?: FilterOption<TData, Key>[];
    onDeletion?: (selected: TData[]) => void;
}

export function DataTable<TData, TValue, Key extends keyof TData> ({ columns, columnKey, data, onDeletion, elements = [], filters = [] }: DataTableProps<TData, TValue, Key>) {
    const [search, setSearch] = useState('');
    const [rowSelection, setRowSelection] = useState({
    });
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFilter<TData, Key>[]>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
            columnFilters,
            columnVisibility,
            globalFilter: search,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onGlobalFilterChange: setSearch,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const selected = table.getSelectedRowModel().flatRows.map((row) => row.original);

    return (
        <div className={'flex flex-col h-full w-full p-1 gap-y-2 border border-lightest/10 rounded-md'}>
            <DataTableHeader<TData, Key>
                filters={filters as FilterOption<TData, Key>[]}
                setColumnFilters={setColumnFilters}
                setSelected={setRowSelection}
                columnKey={columnKey as Key}
                columns={columnFilters}
                setSearch={setSearch}
                onDeletion={onDeletion}
                selected={selected}
                elements={elements}
                search={search}
            />
            <div className="relative flex flex-col w-full h-full overflow-hidden overflow-y-scroll pb-2">
                <div
                    className="rounded-lg border-2 text-lightest/80 border-lightest bg-darkD/60 backdrop-blur-sm shadow-black shadow-md"
                >
                    <Table>
                        <TableHeader>
                            {
                                table.getHeaderGroups()
                                    .map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {
                                                headerGroup.headers.map((header) => (
                                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                                        {
                                                            header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext(),
                                                                )
                                                        }
                                                    </TableHead>
                                                ))
                                            }
                                        </TableRow>
                                    ))
                            }
                        </TableHeader>
                        <TableBody>
                            {
                                table.getRowModel().rows?.length
                                    ? (
                                        table.getRowModel()
                                            .rows
                                            .map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && 'selected'}
                                                >
                                                    {
                                                        row.getVisibleCells()
                                                            .map((cell) => (
                                                                <TableCell key={cell.id}>
                                                                    {
                                                                        flexRender(
                                                                            cell.column.columnDef.cell,
                                                                            cell.getContext(),
                                                                        )
                                                                    }
                                                                </TableCell>
                                                            ))
                                                    }
                                                </TableRow>
                                            ))
                                    )
                                    : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-80 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}
