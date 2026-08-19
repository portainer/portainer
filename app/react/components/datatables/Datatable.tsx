import './datatable.css';

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
import { BasicTableSettings, DefaultType } from './types';
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

export interface Props<D extends DefaultType> extends AutomationTestingProps {
  dataset: D[];
  columns: TableOptions<D>['columns'];
  renderTableSettings?(instance: TableInstance<D>): ReactNode;
  renderTableActions?(selectedRows: D[]): ReactNode;
  disableSelect?: boolean;
  getRowId?(row: D): string;
  isRowSelectable?(row: Row<D>): boolean;
  emptyContentLabel?: string;
  title?: ReactNode;
  titleId?: string;
  titleIcon?: IconProps['icon'];
  initialTableState?: Partial<TableState>;
  isLoading?: boolean;
  description?: ReactNode;
  highlightedItemId?: string;
  settingsManager: GlobalTableState<BasicTableSettings>;
  renderRow?(row: Row<D>, highlightedItemId?: string): ReactNode;
  getRowCanExpand?(row: Row<D>): boolean;
  noWidget?: boolean;
  extendTableOptions?: (options: TableOptions<D>) => TableOptions<D>;
  onSearchChange?: (search: string) => void;
  includeSearch?: boolean;
  ariaLabel?: string;
  id?: string;
}

export function Datatable<D extends DefaultType>({
  columns,
  dataset,
  renderTableSettings = () => null,
  renderTableActions = () => null,
  disableSelect,
  getRowId = defaultGetRowId,
  isRowSelectable = () => true,
  title,
  titleIcon,
  titleId,
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
  onPageChange = () => {},
  onSearchChange = () => {},
  page,
  totalCount = dataset.length,
  isServerSidePagination = false,
  extendTableOptions = (value) => value,
  includeSearch,
  ariaLabel,
  id,
}: Props<D> & PaginationProps) {
  const pageCount = useMemo(
    () => Math.ceil(totalCount / settings.pageSize),
    [settings.pageSize, totalCount]
  );

  const enableRowSelection = getIsSelectionEnabled(
    disableSelect,
    isRowSelectable
  );

  const allColumns = useMemo(
    () =>
      _.compact([!disableSelect && createSelectColumn<D>(dataCy), ...columns]),
    [disableSelect, dataCy, columns]
  );

  const tableInstance = useReactTable<D>(
    extendTableOptions({
      columns: allColumns,
      data: dataset,
      initialState: {
        pagination: {
          pageSize: settings.pageSize,
          pageIndex: page || 0,
        },
        sorting: settings.sortBy ? [settings.sortBy] : [],

        ...initialTableState,

        globalFilter: {
          search: settings.search,
          ...initialTableState.globalFilter,
        },
      },
      defaultColumn: {
        enableColumnFilter: false,
        enableHiding: true,
        sortingFn: 'alphanumeric',
      },
      enableRowSelection,
      autoResetExpanded: false,
      globalFilterFn: defaultGlobalFilterFn,
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
        ? {
            pageCount,
            manualPagination: true,
            manualFiltering: true,
            manualSorting: true,
          }
        : {
            getSortedRowModel: getSortedRowModel(),
          }),
    })
  );

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
  const filteredItems = tableInstance
    .getFilteredRowModel()
    .rows.map((row) => row.original);

  const hiddenSelectedItems = useMemo(
    () => _.difference(selectedItems, filteredItems),
    [selectedItems, filteredItems]
  );
  const { titleAriaLabel, contentAriaLabel } = getAriaLabels(
    ariaLabel,
    title,
    titleId
  );

  return (
    <Table.Container noWidget={noWidget} aria-label={titleAriaLabel} id={id}>
      <DatatableHeader
        onSearchChange={handleSearchBarChange}
        searchValue={settings.search}
        title={title}
        titleId={titleId}
        titleIcon={titleIcon}
        description={description}
        renderTableActions={() => renderTableActions(selectedItems)}
        renderTableSettings={() => renderTableSettings(tableInstance)}
        data-cy={`${dataCy}-header`}
        includeSearch={includeSearch}
      />

      <DatatableContent<D>
        tableInstance={tableInstance}
        renderRow={(row) => renderRow(row, highlightedItemId)}
        emptyContentLabel={emptyContentLabel}
        isLoading={isLoading}
        onSortChange={handleSortChange}
        data-cy={dataCy}
        aria-label={contentAriaLabel}
      />

      <DatatableFooter
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        page={typeof page === 'number' ? page : tableState.pagination.pageIndex}
        pageSize={tableState.pagination.pageSize}
        pageCount={tableInstance.getPageCount()}
        totalSelected={selectedItems.length}
        totalHiddenSelected={hiddenSelectedItems.length}
      />
    </Table.Container>
  );

  function handleSearchBarChange(search: string) {
    tableInstance.setGlobalFilter({ search });
    settings.setSearch(search);
    onSearchChange(search);
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

function getAriaLabels(
  titleAriaLabel?: string,
  title?: ReactNode,
  titleId?: string
) {
  if (titleAriaLabel) {
    return { titleAriaLabel, contentAriaLabel: `${titleAriaLabel} table` };
  }
  if (typeof title === 'string') {
    return { titleAriaLabel: title, contentAriaLabel: `${title} table` };
  }
  if (titleId) {
    return { titleAriaLabel: titleId, contentAriaLabel: `${titleId} table` };
  }
  return { titleAriaLabel: 'table', contentAriaLabel: 'table' };
}

function defaultRenderRow<D extends DefaultType>(
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

function getIsSelectionEnabled<D extends DefaultType>(
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

export function defaultGlobalFilterFn<D, TFilter extends { search: string }>(
  row: Row<D>,
  columnId: string,
  filterValue: null | TFilter
): boolean {
  const value = row.getValue(columnId);

  if (filterValue === null || !filterValue.search) {
    return true;
  }

  if (value == null) {
    return false;
  }

  const filterValueLower = filterValue.search.toLowerCase();

  if (typeof value === 'object') {
    return Object.values(value).some((item) =>
      filterPrimitive(item, filterValueLower)
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => filterPrimitive(item, filterValueLower));
  }

  return filterPrimitive(value, filterValueLower);
}

// only filter primitive values within objects and arrays, to avoid searching nested objects
function filterPrimitive(value: unknown, filterValueLower: string) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value.toString().toLowerCase().includes(filterValueLower);
  }
  return false;
}

function getColumnCanGlobalFilter<D>(column: Column<D>): boolean {
  return column.id !== 'select';
}
