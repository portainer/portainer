import {
  Table as TableInstance,
  TableState,
  useReactTable,
  Row,
  Column,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getExpandedRowModel,
  TableOptions,
  TableMeta,
} from '@tanstack/react-table';
import { ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import _ from 'lodash';

import { AutomationTestingProps } from '@/types';

import { IconProps } from '@@/Icon';

import { DatatableHeader } from './DatatableHeader';
import { DatatableFooter } from './DatatableFooter';
import { defaultGetRowId } from './defaultGetRowId';
import { Table } from './Table';
import { useGoToHighlightedRow } from './useGoToHighlightedRow';
import { BasicTableSettings } from './types';
import { DatatableContent } from './DatatableContent';
import { createSelectColumn } from './select-column';
import { TableRow } from './TableRow';
import { type TableState as GlobalTableState } from './useTableState';

export type PaginationProps =
  | {
      isServerSidePagination?: false;
      totalCount?: never;
      page?: never;
      onPageChange?: never;
    }
  | {
      isServerSidePagination: true;
      totalCount: number;
      page: number;
      onPageChange(page: number): void;
    };

export interface Props<
  D extends Record<string, unknown>,
  TMeta extends TableMeta<D> = TableMeta<D>
> extends AutomationTestingProps {
  dataset: D[];
  columns: TableOptions<D>['columns'];
  renderTableSettings?(instance: TableInstance<D>): ReactNode;
  renderTableActions?(selectedRows: D[]): ReactNode;
  disableSelect?: boolean;
  getRowId?(row: D): string;
  isRowSelectable?(row: Row<D>): boolean;
  emptyContentLabel?: string;
  title?: string;
  titleIcon?: IconProps['icon'];
  initialTableState?: Partial<TableState>;
  isLoading?: boolean;
  description?: ReactNode;
  highlightedItemId?: string;
  settingsManager: GlobalTableState<BasicTableSettings>;
  renderRow?(row: Row<D>, highlightedItemId?: string): ReactNode;
  getRowCanExpand?(row: Row<D>): boolean;
  noWidget?: boolean;
  meta?: TMeta;
}

export function Datatable<
  D extends Record<string, unknown>,
  TMeta extends TableMeta<D> = TableMeta<D>
>({
  columns,
  dataset,
  renderTableSettings = () => null,
  renderTableActions = () => null,
  disableSelect,
  getRowId = defaultGetRowId,
  isRowSelectable = () => true,
  title,
  titleIcon,
  emptyContentLabel,
  initialTableState = {},
  isLoading,
  description,
  settingsManager: settings,
  renderRow = defaultRenderRow,
  highlightedItemId,
  noWidget,
  getRowCanExpand,
  'data-cy': dataCy,
  meta,
  onPageChange = () => {},
  page,
  totalCount = dataset.length,
  isServerSidePagination = false,
}: Props<D, TMeta> & PaginationProps) {
  const pageCount = useMemo(
    () => Math.ceil(totalCount / settings.pageSize),
    [settings.pageSize, totalCount]
  );

  const enableRowSelection = getIsSelectionEnabled(
    disableSelect,
    isRowSelectable
  );

  const allColumns = useMemo(
    () => _.compact([!disableSelect && createSelectColumn<D>(), ...columns]),
    [disableSelect, columns]
  );

  const tableInstance = useReactTable<D>({
    columns: allColumns,
    data: dataset,
    initialState: {
      pagination: {
        pageSize: settings.pageSize,
        pageIndex: page || 0,
      },
      sorting: settings.sortBy ? [settings.sortBy] : [],
      globalFilter: settings.search,

      ...initialTableState,
    },
    defaultColumn: {
      enableColumnFilter: false,
      enableHiding: true,
      sortingFn: 'alphanumeric',
    },
    enableRowSelection,
    autoResetExpanded: false,
    globalFilterFn,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
    getColumnCanGlobalFilter,
    ...(isServerSidePagination
      ? { manualPagination: true, pageCount }
      : {
          getSortedRowModel: getSortedRowModel(),
        }),
    meta,
  });

  const tableState = tableInstance.getState();

  useGoToHighlightedRow(
    isServerSidePagination,
    tableState.pagination.pageSize,
    tableInstance.getCoreRowModel().rows,
    handlePageChange,
    highlightedItemId
  );

  const selectedRowModel = tableInstance.getSelectedRowModel();
  const selectedItems = selectedRowModel.rows.map((row) => row.original);

  return (
    <Table.Container noWidget={noWidget}>
      <DatatableHeader
        onSearchChange={handleSearchBarChange}
        searchValue={settings.search}
        title={title}
        titleIcon={titleIcon}
        description={description}
        renderTableActions={() => renderTableActions(selectedItems)}
        renderTableSettings={() => renderTableSettings(tableInstance)}
      />

      <DatatableContent<D>
        tableInstance={tableInstance}
        renderRow={(row) => renderRow(row, highlightedItemId)}
        emptyContentLabel={emptyContentLabel}
        isLoading={isLoading}
        onSortChange={handleSortChange}
        data-cy={dataCy}
      />

      <DatatableFooter
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        page={typeof page === 'number' ? page : tableState.pagination.pageIndex}
        pageSize={tableState.pagination.pageSize}
        pageCount={tableInstance.getPageCount()}
        totalSelected={selectedItems.length}
      />
    </Table.Container>
  );

  function handleSearchBarChange(value: string) {
    tableInstance.setGlobalFilter(value);
    settings.setSearch(value);
  }

  function handlePageChange(page: number) {
    tableInstance.setPageIndex(page);
    onPageChange(page);
  }

  function handleSortChange(colId: string, desc: boolean) {
    settings.setSortBy(colId, desc);
  }

  function handlePageSizeChange(pageSize: number) {
    tableInstance.setPageSize(pageSize);
    settings.setPageSize(pageSize);
  }
}

function defaultRenderRow<D extends Record<string, unknown>>(
  row: Row<D>,
  highlightedItemId?: string
) {
  return (
    <TableRow<D>
      cells={row.getVisibleCells()}
      className={clsx({
        active: highlightedItemId === row.id,
      })}
    />
  );
}

function getIsSelectionEnabled<D extends Record<string, unknown>>(
  disabledSelect?: boolean,
  isRowSelectable?: Props<D>['isRowSelectable']
) {
  if (disabledSelect) {
    return false;
  }

  if (isRowSelectable) {
    return isRowSelectable;
  }

  return true;
}

function globalFilterFn<D>(
  row: Row<D>,
  columnId: string,
  filterValue: null | string
): boolean {
  const value = row.getValue(columnId);

  if (filterValue === null || filterValue === '') {
    return true;
  }

  if (value == null) {
    return false;
  }

  const filterValueLower = filterValue.toLowerCase();

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value.toString().toLowerCase().includes(filterValueLower);
  }

  if (Array.isArray(value)) {
    return value.some((item) =>
      item.toString().toLowerCase().includes(filterValueLower)
    );
  }

  return false;
}

function getColumnCanGlobalFilter<D>(column: Column<D, unknown>): boolean {
  if (column.id === 'select') {
    return false;
  }
  return true;
}
