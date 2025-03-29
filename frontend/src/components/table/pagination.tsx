import { Table } from '@tanstack/react-table';
import { FaAngleDoubleRight, FaAngleDoubleLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { BaseButton } from '@/components/button';
import { FramesSelect } from '@/components/select';

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
}

const buttonClass = 'h-8 w-8 p-0 hover:text-lightest disabled:pointer-events-none border rounded-md border-lightest/50 flex items-center justify-center hover:border-lightest/70 transition-all duration-300 ease-in-out';

export function DataTablePagination<TData> ({ table }: DataTablePaginationProps<TData>) {
    return (
        <div className="flex items-center w-full justify-end space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-lightest/80">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2 text-lightest/80">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <FramesSelect
                        options={['10', '15']}
                        className={'w-[70px]'}
                        value={table.getState().pagination.pageSize.toString()}
                        onChange={(value) => table.setPageSize(Number(value))}
                    />
                </div>
                <BaseButton
                    className={buttonClass}
                    title={'Go to first page'}
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    <span className="sr-only">Go to first page</span>
                    <FaAngleDoubleLeft className="h-4 w-4" />
                </BaseButton>
                <BaseButton
                    className={buttonClass}
                    title={'Go to previous page'}
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <span className="sr-only">Go to previous page</span>
                    <FaChevronLeft className="h-4 w-4" />
                </BaseButton>
                <BaseButton
                    className={buttonClass}
                    title={'Go to next page'}
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    <span className="sr-only">Go to next page</span>
                    <FaChevronRight className="h-4 w-4" />
                </BaseButton>
                <BaseButton
                    className={buttonClass}
                    title={'Go to last page'}
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    <span className="sr-only">Go to last page</span>
                    <FaAngleDoubleRight className="h-4 w-4" />
                </BaseButton>
            </div>
        </div>
    );
}

