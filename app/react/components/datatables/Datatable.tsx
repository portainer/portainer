import {
  useTable,
  useFilters,
  useGlobalFilter,
  useSortBy,
  usePagination,
  Column,
  Row,
  TableInstance,
  TableState,
  TableRowProps,
  useExpanded,
} from 'react-table';
import { ReactNode } from 'react';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import clsx from 'clsx';

import { IconProps } from '@@/Icon';

import { Table } from './Table';
import { multiple } from './filter-types';
import { useRowSelect } from './useRowSelect';
import { BasicTableSettings } from './types';
import { DatatableHeader } from './DatatableHeader';
import { DatatableFooter } from './DatatableFooter';
import { DatatableContent } from './DatatableContent';
import { defaultGetRowId } from './defaultGetRowId';
import { emptyPlugin } from './emptyReactTablePlugin';
import { useGoToHighlightedRow } from './useGoToHighlightedRow';

export interface Props<D extends Record<string, unknown>> {
  dataset: D[];
  columns: readonly Column<D>[];
  renderTableSettings?(instance: TableInstance<D>): ReactNode;
  renderTableActions?(selectedRows: D[]): ReactNode;
  disableSelect?: boolean;
  getRowId?(row: D): string;
  isRowSelectable?(row: Row<D>): boolean;
  emptyContentLabel?: string;
  title?: string;
  titleIcon?: IconProps['icon'];
  initialTableState?: Partial<TableState<D>>;
  isLoading?: boolean;
  totalCount?: number;
  description?: ReactNode;
  pageCount?: number;
  initialSortBy?: BasicTableSettings['sortBy'];
  initialPageSize?: BasicTableSettings['pageSize'];
  highlightedItemId?: string;

  searchValue: string;
  onSearchChange(search: string): void;
  onSortByChange(colId: string, desc: boolean): void;
  onPageSizeChange(pageSize: number): void;

  // send state up
  onPageChange?(page: number): void;

  renderRow?(
    row: Row<D>,
    rowProps: TableRowProps,
    highlightedItemId?: string
  ): ReactNode;
  expandable?: boolean;
  noWidget?: boolean;
}

export function Datatable<D extends Record<string, unknown>>({
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
  totalCount = dataset.length,
  description,
  pageCount,

  initialSortBy,
  initialPageSize = 10,
  onPageChange = () => {},

  onPageSizeChange,
  onSortByChange,
  searchValue,
  onSearchChange,

  renderRow = defaultRenderRow,
  expandable = false,
  highlightedItemId,
  noWidget,
}: Props<D>) {
  const isServerSidePagination = typeof pageCount !== 'undefined';

  const tableInstance = useTable<D>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        pageSize: initialPageSize,
        sortBy: initialSortBy ? [initialSortBy] : [],
        globalFilter: searchValue,
        ...initialTableState,
      },
      isRowSelectable,
      autoResetExpanded: false,
      autoResetSelectedRows: false,
      getRowId,
      ...(isServerSidePagination ? { manualPagination: true, pageCount } : {}),
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    expandable ? useExpanded : emptyPlugin,
    usePagination,
    useRowSelect,
    !disableSelect ? useRowSelectColumn : emptyPlugin
  );

  useGoToHighlightedRow(
    isServerSidePagination,
    tableInstance.state.pageSize,
    tableInstance.rows,
    handlePageChange,
    highlightedItemId
  );

  const selectedItems = tableInstance.selectedFlatRows.map(
    (row) => row.original
  );

  return (
    <Table.Container noWidget={noWidget}>
      <DatatableHeader
        onSearchChange={handleSearchBarChange}
        searchValue={searchValue}
        title={title}
        titleIcon={titleIcon}
        renderTableActions={() => renderTableActions(selectedItems)}
        renderTableSettings={() => renderTableSettings(tableInstance)}
        description={description}
      />
      <DatatableContent<D>
        tableInstance={tableInstance}
        renderRow={(row, rowProps) =>
          renderRow(row, rowProps, highlightedItemId)
        }
        emptyContentLabel={emptyContentLabel}
        isLoading={isLoading}
        onSortChange={handleSortChange}
      />

      <DatatableFooter
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        page={tableInstance.state.pageIndex}
        pageSize={tableInstance.state.pageSize}
        totalCount={totalCount}
        totalSelected={selectedItems.length}
      />
    </Table.Container>
  );

  function handleSearchBarChange(value: string) {
    tableInstance.setGlobalFilter(value);
    onSearchChange(value);
  }

  function handlePageChange(page: number) {
    tableInstance.gotoPage(page);
    onPageChange(page);
  }

  function handleSortChange(colId: string, desc: boolean) {
    onSortByChange(colId, desc);
  }

  function handlePageSizeChange(pageSize: number) {
    tableInstance.setPageSize(pageSize);
    onPageSizeChange(pageSize);
  }
}

function defaultRenderRow<D extends Record<string, unknown>>(
  row: Row<D>,
  rowProps: TableRowProps,
  highlightedItemId?: string
) {
  return (
    <Table.Row<D>
      key={rowProps.key}
      cells={row.cells}
      className={clsx(rowProps.className, {
        active: highlightedItemId === row.id,
      })}
      role={rowProps.role}
      style={rowProps.style}
    />
  );
}
