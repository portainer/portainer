import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';
import { useMemo, useState } from 'react';
import clsx from 'clsx';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { isSortType } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';
import { semverCompare } from '@/react/common/semver-utils';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Datatable, TableRow } from '@@/datatables';
import { Badge } from '@@/Badge';
import { Widget } from '@@/Widget';

import { EnvironmentTableData } from './types';

const columnHelper = createColumnHelper<EnvironmentTableData>();

const tableKey = 'available-environments';
const settingsStore = createPersistedStore(tableKey, 'Name');

interface Props extends AutomationTestingProps {
  title: string;
  /** IDs to exclude from the query (environments already associated) */
  excludeIds: Array<EnvironmentId>;
  /** IDs to include in the query (e.g., recently removed from associated - will be highlighted) */
  includeIds?: Array<EnvironmentId>;
  onClickRow?: (env: EnvironmentTableData) => void;
}

export function AvailableEnvironmentsTable({
  title,
  excludeIds,
  includeIds = [],
  onClickRow,
  'data-cy': dataCy,
}: Props) {
  const tableState = useTableState(settingsStore, tableKey);
  const [page, setPage] = useState(0);
  const columns = useMemo(() => buildColumns(includeIds), [includeIds]);

  // Query unassigned environments (group 1)
  const unassignedQuery = useEnvironmentList({
    pageLimit: tableState.pageSize,
    page: page + 1,
    search: tableState.search,
    sort: isSortType(tableState.sortBy?.id) ? tableState.sortBy.id : 'Name',
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    groupIds: [1],
    excludeIds,
  });

  // Query removed environments by ID (these are still in their original group until saved)
  const removedQuery = useEnvironmentList(
    {
      endpointIds: includeIds,
      search: tableState.search,
    },
    { enabled: includeIds.length > 0 }
  );

  // Merge results: removed environments + unassigned environments (deduped)
  // Only use removedQuery data when includeIds is non-empty to avoid stale cache
  const environments = useMemo(() => {
    const unassigned = unassignedQuery.environments || [];
    const removed =
      includeIds.length > 0 ? removedQuery.environments || [] : [];

    if (removed.length === 0) {
      return unassigned;
    }

    const unassignedIds = new Set(unassigned.map((e) => e.Id));
    const uniqueRemoved = removed.filter((e) => !unassignedIds.has(e.Id));

    // Sort combined results by name to maintain order
    const combined = [...uniqueRemoved, ...unassigned];
    const isDesc = tableState.sortBy?.desc ?? false;
    // useTypeGuard on tableState.sortBy.id to use as a key for sorting
    const sortKey = getSortKey(tableState.sortBy?.id);
    if (sortKey) {
      return combined.sort((a, b) => {
        const cmp = semverCompare(a[sortKey].toString(), b[sortKey].toString());
        return isDesc ? -cmp : cmp;
      });
    }
    return combined;
  }, [
    unassignedQuery.environments,
    removedQuery.environments,
    includeIds.length,
    tableState.sortBy?.desc,
    tableState.sortBy?.id,
  ]);

  const totalCount =
    unassignedQuery.totalCount +
    (includeIds.length > 0 ? removedQuery.environments?.length || 0 : 0);

  return (
    <Widget className="flex-1 flex flex-col">
      <div
        className={clsx(
          'h-full flex flex-col',
          '[&_section.datatable]:flex-1 [&_section.datatable]:flex [&_section.datatable]:flex-col',
          '[&_.footer]:!mt-auto'
        )}
      >
        <Datatable<EnvironmentTableData>
          // noWidget to avoid padding issues with TableContainer
          noWidget
          title={title}
          columns={columns}
          settingsManager={tableState}
          dataset={environments}
          isServerSidePagination
          page={page}
          onPageChange={setPage}
          totalCount={totalCount}
          renderRow={(row) => (
            <TableRow<EnvironmentTableData>
              cells={row.getVisibleCells()}
              onClick={onClickRow ? () => onClickRow(row.original) : undefined}
            />
          )}
          disableSelect
          data-cy={dataCy || 'available-environments-table'}
        />
      </div>
    </Widget>
  );
}

function buildColumns(highlightIds: Array<EnvironmentId>) {
  return [
    columnHelper.accessor('Name', {
      header: 'Name',
      id: 'Name',
      cell: ({ getValue, row }) => (
        <span className="flex items-center gap-2">
          <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
          {highlightIds.includes(row.original.Id) && (
            <Badge type="muted" data-cy="unsaved-badge">
              Unsaved
            </Badge>
          )}
        </span>
      ),
    }),
  ];
}

function getSortKey(sortId?: string): keyof EnvironmentTableData | undefined {
  if (!sortId) {
    return undefined;
  }
  switch (sortId) {
    case 'Name':
      return 'Name';
    default:
      return 'Name';
  }
  // extend to other keys as needed
}
