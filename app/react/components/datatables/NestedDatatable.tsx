import { useMemo } from 'react';
import { difference } from 'lodash';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  TableOptions,
  TableState,
  useReactTable,
} from '@tanstack/react-table';

import { AutomationTestingProps } from '@/types';

import { IconProps } from '@@/Icon';

import { defaultGetRowId } from './defaultGetRowId';
import { Table } from './Table';
import { NestedTable } from './NestedTable';
import { DatatableContent } from './DatatableContent';
import { DatatableFooter } from './DatatableFooter';
import { BasicTableSettings, DefaultType } from './types';

interface Props<D extends DefaultType> extends AutomationTestingProps {
  dataset: D[];
  columns: TableOptions<D>['columns'];

  getRowId?(row: D): string;
  emptyContentLabel?: string;
  initialTableState?: Partial<TableState>;
  isLoading?: boolean;
  initialSortBy?: BasicTableSettings['sortBy'];
  enablePagination?: boolean;
  title?: React.ReactNode;
  titleIcon?: IconProps['icon'];
  /**
   * keyword to filter by
   */
  search?: string;

  'aria-label'?: string;
}

export function NestedDatatable<D extends DefaultType>({
  columns,
  dataset,
  getRowId = defaultGetRowId,
  emptyContentLabel,
  initialTableState = {},
  isLoading,
  initialSortBy,
  enablePagination = true,
  title,
  titleIcon,
  search,
  'data-cy': dataCy,
  'aria-label': ariaLabel,
}: Props<D>) {
  const tableInstance = useReactTable<D>({
    columns,
    data: dataset,
    initialState: {
      sorting: initialSortBy ? [initialSortBy] : [],
      ...initialTableState,
    },
    defaultColumn: {
      enableColumnFilter: false,
      enableHiding: false,
    },
    state: {
      globalFilter: search,
    },
    getRowId,
    autoResetExpanded: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
  });

  const tableState = tableInstance.getState();
  const selectedRowModel = tableInstance.getSelectedRowModel();
  const selectedItems = selectedRowModel.rows.map((row) => row.original);
  const filteredItems = tableInstance
    .getFilteredRowModel()
    .rows.map((row) => row.original);

  const hiddenSelectedItems = useMemo(
    () => difference(selectedItems, filteredItems),
    [selectedItems, filteredItems]
  );

  return (
    <NestedTable>
      <Table.Container noWidget>
        {title && <Table.Title label={title} icon={titleIcon} />}
        <DatatableContent<D>
          tableInstance={tableInstance}
          isLoading={isLoading}
          emptyContentLabel={emptyContentLabel}
          renderRow={(row) => <Table.Row<D> cells={row.getVisibleCells()} />}
          aria-label={ariaLabel}
          data-cy={dataCy}
        />
        {enablePagination && (
          <DatatableFooter
            onPageChange={tableInstance.setPageIndex}
            onPageSizeChange={tableInstance.setPageSize}
            page={tableState.pagination.pageIndex}
            pageSize={tableState.pagination.pageSize}
            pageCount={tableInstance.getPageCount()}
            totalSelected={selectedItems.length}
            totalHiddenSelected={hiddenSelectedItems.length}
          />
        )}
      </Table.Container>
    </NestedTable>
  );
}
