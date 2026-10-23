import {
  Column,
  Row,
  Table as TableInstance,
  TableOptions,
  TableState,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ComponentType, ReactNode, useMemo } from 'react';
import _ from 'lodash';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { Widget, WidgetBody } from '@@/Widget';
import { Icon } from '@@/Icon';
import { PaginationControls } from '@@/PaginationControls';

import { CardExpandableListRow } from './CardExpandableListRow';
import { defaultGetRowId } from './defaultGetRowId';
import { SearchBar } from './SearchBar';
import { SelectedRowsCount } from './SelectedRowsCount';
import { createSelectColumn } from './select-column';
import { BasicTableSettings, DefaultType } from './types';
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
  settingsManager: GlobalTableState<BasicTableSettings>;
  renderSubRow(row: Row<D>): ReactNode;
  getRowCanExpand?(row: Row<D>): boolean;
  expandOnRowClick?: boolean;
  getRowId?(row: D): string;
  isRowSelectable?(row: Row<D>): boolean;
  disableSelect?: boolean;
  emptyContentLabel?: string;
  isLoading?: boolean;
  description?: ReactNode;
  title?: ReactNode;
  titleId?: string;
  titleIcon?: ComponentType<{ className?: string; size?: number | string }>;
  initialTableState?: Partial<TableState>;
  renderTableSettings?(instance: TableInstance<D>): ReactNode;
  renderTableActions?(selectedRows: D[]): ReactNode;
  extendTableOptions?: (options: TableOptions<D>) => TableOptions<D>;
  onSearchChange?: (search: string) => void;
  includeSearch?: boolean;
  ariaLabel?: string;
  id?: string;
}

export function CardExpandableList<D extends DefaultType>({
  dataset,
  columns,
  settingsManager: settings,
  renderSubRow,
  getRowCanExpand = () => true,
  expandOnRowClick,
  getRowId = defaultGetRowId,
  isRowSelectable = () => true,
  disableSelect,
  emptyContentLabel = 'No items.',
  isLoading,
  description,
  title,
  titleId,
  titleIcon,
  initialTableState = {},
  renderTableSettings,
  renderTableActions,
  extendTableOptions = (value) => value,
  onSearchChange = _.noop,
  includeSearch,
  ariaLabel,
  id,
  page,
  totalCount = dataset.length,
  isServerSidePagination = false,
  onPageChange = _.noop,
  'data-cy': dataCy,
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
      _.compact([
        !disableSelect && createSelectColumn<D>(dataCy ?? ''),
        ...columns,
      ]),
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
      globalFilterFn: cardListGlobalFilterFn,
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
  const selectedItems = tableInstance
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const filteredItems = tableInstance
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const hiddenSelectedItems = useMemo(
    () => _.difference(selectedItems, filteredItems),
    [selectedItems, filteredItems]
  );
  const visibleRows = tableInstance.getPaginationRowModel().rows;

  const includeSearchBar = includeSearch ?? !!title;

  function handleSearch(value: string) {
    tableInstance.setGlobalFilter({ search: value });
    settings.setSearch(value);
    onSearchChange(value);
  }

  function handlePageChange(newPage: number) {
    tableInstance.setPageIndex(newPage);
    onPageChange(newPage);
  }

  function handlePageSizeChange(pageSize: number) {
    tableInstance.setPageSize(pageSize);
    settings.setPageSize(pageSize);
  }

  const ariaLabelValue =
    ariaLabel ??
    (typeof title === 'string' ? title : titleId ? titleId : 'list');

  return (
    <Widget aria-label={ariaLabelValue} id={id}>
      <WidgetBody className="!p-0">
        {(title ||
          includeSearchBar ||
          renderTableActions ||
          renderTableSettings) && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-t-xl bg-[color:var(--bg-card-color)] px-5 py-4 text-base"
            data-cy={dataCy ? `${dataCy}-header` : undefined}
          >
            {title && (
              <h2
                id={titleId}
                className="m-0 flex flex-auto items-center gap-1 text-base font-medium text-[color:var(--text-widget-header-color)]"
              >
                {titleIcon && <Icon icon={titleIcon} className="space-right" />}
                {title}
              </h2>
            )}
            {includeSearchBar && (
              <SearchBar
                value={settings.search}
                onChange={handleSearch}
                data-cy={`${dataCy ?? 'card-expandable-list'}-search-input`}
              />
            )}
            {renderTableActions && (
              <div className="actionBar inline-flex items-center gap-2">
                {renderTableActions(selectedItems)}
              </div>
            )}
            {renderTableSettings && (
              <div className="settings inline-flex items-center">
                {renderTableSettings(tableInstance)}
              </div>
            )}
          </div>
        )}
        {description && (
          <div className="bg-[color:var(--bg-card-color)] px-5 pb-3 text-sm">
            {description}
          </div>
        )}
        <div
          className={clsx(
            'flex flex-col gap-2 bg-[color:var(--bg-card-color)] px-4 py-2'
          )}
          aria-label={ariaLabelValue}
          data-cy={dataCy}
        >
          {isLoading ? (
            <div className="py-8 text-center text-sm text-[color:var(--text-summary-color,var(--text-main-color))]">
              Loading...
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-8 text-center text-sm text-[color:var(--text-summary-color,var(--text-main-color))]">
              {emptyContentLabel}
            </div>
          ) : (
            visibleRows.map((row) => (
              <CardExpandableListRow<D>
                key={row.id}
                row={row}
                renderSubRow={renderSubRow}
                expandOnClick={expandOnRowClick}
              />
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-solid border-[color:var(--border-datatable-top-color,var(--border-widget))] bg-[color:var(--bg-card-color)] px-4 py-2 pb-3 text-[color:var(--text-main-color)]">
          <SelectedRowsCount
            value={selectedItems.length}
            hidden={hiddenSelectedItems.length}
          />
          <div className="ml-auto">
            <PaginationControls
              showAll
              pageLimit={tableState.pagination.pageSize}
              page={
                (typeof page === 'number'
                  ? page
                  : tableState.pagination.pageIndex) + 1
              }
              onPageChange={(p) => handlePageChange(p - 1)}
              pageCount={tableInstance.getPageCount()}
              onPageLimitChange={handlePageSizeChange}
            />
          </div>
        </div>
      </WidgetBody>
    </Widget>
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

function getColumnCanGlobalFilter<D>(column: Column<D>): boolean {
  return column.id !== 'select';
}

function cardListGlobalFilterFn<D, TFilter extends { search: string }>(
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
    return Object.values(value as Record<string, unknown>).some((item) =>
      filterPrimitive(item, filterValueLower)
    );
  }
  if (Array.isArray(value)) {
    return value.some((item) => filterPrimitive(item, filterValueLower));
  }
  return filterPrimitive(value, filterValueLower);
}

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
