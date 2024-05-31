import { createColumnHelper } from '@tanstack/react-table';
import { History, Search } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { Button } from '@@/buttons';
import { JsonTree } from '@@/JsonTree';

import { ActivityLog } from './types';
import { getSortType } from './useActivityLogs';

const columnHelper = createColumnHelper<ActivityLog>();

const columns = [
  columnHelper.accessor('timestamp', {
    id: 'Timestamp',
    header: 'Time',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? isoDateFromTimestamp(value) : '';
    },
  }),
  columnHelper.accessor('username', {
    id: 'Username',
    header: 'User',
  }),
  columnHelper.accessor('context', {
    id: 'Context',
    header: 'Environment',
  }),
  columnHelper.accessor('action', {
    id: 'Action',
    header: 'Action',
  }),
  columnHelper.accessor('payload', {
    header: 'Payload',
    enableSorting: false,
    cell: ({ row, getValue }) =>
      getValue() ? (
        <Button
          color="link"
          onClick={() => row.toggleExpanded()}
          icon={Search}
          data-cy={`activity-logs-inspect_${row.index}`}
        >
          inspect
        </Button>
      ) : null,
  }),
];

export function ActivityLogsTable({
  dataset,
  currentPage,
  keyword,
  limit,
  onChangeKeyword,
  onChangeLimit,
  onChangePage,
  onChangeSort,
  sort,
  totalItems,
}: {
  keyword: string;
  onChangeKeyword(keyword: string): void;
  sort: { id: string; desc: boolean } | undefined;
  onChangeSort(sort: { id: string; desc: boolean } | undefined): void;
  limit: number;
  onChangeLimit(limit: number): void;
  currentPage: number;
  onChangePage(page: number): void;
  totalItems: number;
  dataset?: Array<ActivityLog>;
}) {
  return (
    <ExpandableDatatable<ActivityLog>
      title="Activity logs"
      titleIcon={History}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={{
        pageSize: limit,
        search: keyword,
        setPageSize: onChangeLimit,
        setSearch: onChangeKeyword,
        setSortBy: (id, desc) =>
          onChangeSort({ id: getSortType(id) || 'Timestamp', desc }),
        sortBy: sort
          ? {
              id: sort.id,
              desc: sort.desc,
            }
          : undefined,
      }}
      page={currentPage}
      onPageChange={onChangePage}
      isServerSidePagination
      totalCount={totalItems}
      disableSelect
      renderSubRow={(row) => <SubRow item={row.original} />}
      data-cy="activity-logs-datatable"
    />
  );
}

function SubRow({ item }: { item: ActivityLog }) {
  return (
    <tr>
      <td colSpan={Number.MAX_SAFE_INTEGER}>
        <JsonTree data={item.payload} />
      </td>
    </tr>
  );
}
