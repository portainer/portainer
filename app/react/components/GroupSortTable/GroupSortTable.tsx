import React, { ReactNode, useMemo } from 'react';
import { ColumnDef, Row, TableOptions } from '@tanstack/react-table';

import { Datatable } from '@@/datatables';
import { PaginationControls } from '@@/PaginationControls';
import { Widget } from '@@/Widget';

import { GroupSortTableHeader } from './GroupSortTableHeader';
import { GroupSortTableState } from './useGroupSortTableState';

export type GroupEntry = {
  key: string;
  label?: string;
  count: number;
  icon?: React.ReactNode;
};

interface Props<TItem extends object> {
  data: TItem[];
  isLoading: boolean;
  columns: ColumnDef<TItem, unknown>[];
  renderRow: (row: Row<TItem>) => React.ReactNode;
  getRowId: (item: TItem) => string;
  tableState: GroupSortTableState;
  sortOptions: Array<{ key: string; label: string }>;
  totalCount: number;
  availableGroupsBySort: Record<string, GroupEntry[]>;
  getGroupKey?: (item: TItem, sortBy: string) => string;
  renderGroupHeader?: (groupKey: string, count: number) => React.ReactNode;
  pinToBottom?: (item: TItem) => boolean;
  emptyContentLabel?: string | { withSearch: string; withoutSearch: string };
  loadingLabel?: string;
  actionButton?: React.ReactNode;
  searchPlaceholder?: string;
  'data-cy'?: string;
  headerButtons?: Array<ReactNode>;
}

export function GroupSortTable<TItem extends object>({
  data,
  isLoading,
  columns,
  renderRow,
  getRowId,
  tableState,
  sortOptions,
  totalCount,
  availableGroupsBySort,
  getGroupKey,
  renderGroupHeader,
  pinToBottom,
  emptyContentLabel,
  loadingLabel = 'Loading...',
  actionButton,
  searchPlaceholder,
  headerButtons,
  'data-cy': dataCy,
}: Props<TItem>) {
  const sortBy = useMemo(() => {
    if (!tableState.sortBy) return sortOptions[0]?.key ?? '';
    return tableState.sortBy.id;
  }, [tableState.sortBy, sortOptions]);

  // Build a fast lookup from groupKey → total count for the active sort.
  const groupCountByKey = useMemo<Record<string, number>>(() => {
    const entries = availableGroupsBySort[sortBy] ?? [];
    return Object.fromEntries(
      entries.map(({ key, label, count }) => [label ?? key, count])
    );
  }, [availableGroupsBySort, sortBy]);

  // Detect group boundaries within the current page.
  // Since the server returns pre-sorted data, the first time a group key appears
  // on a page is definitionally the start of that group on this page.
  const firstInGroupSet = useMemo<Set<string>>(() => {
    if (!getGroupKey) return new Set();
    const seen = new Set<string>();
    const ids = new Set<string>();
    data.forEach((item) => {
      const key = getGroupKey(item, sortBy);
      if (!seen.has(key)) {
        seen.add(key);
        ids.add(getRowId(item));
      }
    });
    return ids;
  }, [data, getGroupKey, getRowId, sortBy]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / tableState.pageSize)),
    [totalCount, tableState.pageSize]
  );

  const emptyLabel = useMemo(() => {
    if (!emptyContentLabel) {
      return tableState.search
        ? 'No results match your search'
        : 'No items found';
    }
    if (typeof emptyContentLabel === 'string') return emptyContentLabel;
    return tableState.search
      ? emptyContentLabel.withSearch
      : emptyContentLabel.withoutSearch;
  }, [emptyContentLabel, tableState.search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-cy={dataCy}>
        <span className="text-sm text-gray-7 th-dark:text-gray-5">
          {loadingLabel}
        </span>
      </div>
    );
  }

  return (
    <Widget className="overflow-clip [&_table]:bg-transparent" data-cy={dataCy}>
      <GroupSortTableHeader
        sortBy={sortBy}
        onSortChange={handleSortChange}
        searchTerm={tableState.search}
        onSearchChange={(value) => {
          tableState.setSearch(value);
          tableState.setPage(1);
          tableState.setGroupBy(null);
        }}
        sortOptions={sortOptions}
        searchPlaceholder={searchPlaceholder}
        actionButton={actionButton}
        groupFilter={tableState.groupBy}
        groupOptions={availableGroupsBySort}
        onGroupFilterChange={handleGroupFilterChange}
        headerButtons={headerButtons}
        data-cy={dataCy || ''}
      />
      <div className="[&_.footer]:hidden [&_thead]:hidden">
        <Datatable
          key={`${tableState.sortBy?.id}-${tableState.sortBy?.desc}-${
            tableState.search
          }-${tableState.page}-${tableState.pageSize}-${
            tableState.groupBy ?? 'all'
          }`}
          settingsManager={tableState}
          columns={columns}
          dataset={data}
          initialTableState={{
            pagination: {
              pageIndex: 0,
              pageSize: tableState.pageSize,
            },
          }}
          renderRow={rowWithGroupHeader}
          getRowId={getRowId}
          disableSelect
          noWidget
          emptyContentLabel={emptyLabel}
          extendTableOptions={pinToBottomExtension}
          data-cy={dataCy ?? ''}
        />
      </div>
      <div
        data-cy="table-pagination"
        className="border-0 border-t border-solid border-gray-4 px-5 py-3 th-highcontrast:border-white th-dark:border-gray-7"
      >
        <PaginationControls
          page={tableState.page}
          pageCount={totalPages}
          onPageChange={tableState.setPage}
          pageLimit={tableState.pageSize}
          onPageLimitChange={(n) => {
            tableState.setPageSize(n);
          }}
        />
      </div>
    </Widget>
  );

  function rowWithGroupHeader(row: Row<TItem>): React.ReactNode {
    if (!getGroupKey || !renderGroupHeader) {
      return renderRow(row);
    }

    const groupKey = getGroupKey(row.original, sortBy);
    if (!firstInGroupSet.has(row.id)) {
      return renderRow(row);
    }

    return (
      <>
        <tr>
          <td colSpan={Number.MAX_SAFE_INTEGER} className="!p-0">
            {renderGroupHeader(groupKey, groupCountByKey[groupKey] ?? 0)}
          </td>
        </tr>
        {renderRow(row)}
      </>
    );
  }

  function handleSortChange(key: string) {
    tableState.setPage(1);
    tableState.setSortBy(key, false);
  }

  function handleGroupFilterChange(value: string | null) {
    tableState.setGroupBy(value);
    tableState.setPage(1);
  }

  function pinToBottomExtension(
    options: TableOptions<TItem>
  ): TableOptions<TItem> {
    if (!pinToBottom) return options;

    const originalGetSortedRowModel = options.getSortedRowModel;
    if (!originalGetSortedRowModel) return options;

    return {
      ...options,
      getSortedRowModel: (table) => {
        const getSortedRowModel = originalGetSortedRowModel(table);
        return () => {
          const rowModel = getSortedRowModel();
          if (!rowModel?.rows) return rowModel;

          const main = rowModel.rows.filter(
            (row) => !pinToBottom(row.original)
          );
          const pinned = rowModel.rows.filter((row) =>
            pinToBottom(row.original)
          );

          return {
            ...rowModel,
            rows: [...main, ...pinned],
          };
        };
      },
    };
  }
}
