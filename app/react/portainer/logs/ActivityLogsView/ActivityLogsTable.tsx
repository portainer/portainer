import { createColumnHelper } from '@tanstack/react-table';
import { History, Search } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { Button } from '@@/buttons';
import { JsonTree } from '@@/JsonTree';

interface ActivityLog {
  timestamp: number;
  action: string;
  context: string;
  id: number;
  payload: object;
  username: string;
}

const columnHelper = createColumnHelper<ActivityLog>();

const columns = [
  columnHelper.accessor('timestamp', {
    header: 'Time',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? isoDateFromTimestamp(value) : '';
    },
  }),
  columnHelper.accessor('username', {
    header: 'User',
  }),
  columnHelper.accessor('context', {
    header: 'Environment',
  }),
  columnHelper.accessor('action', {
    header: 'Action',
  }),
  columnHelper.accessor('payload', {
    header: 'Payload',
    enableSorting: false,
    cell: ({ row, getValue }) =>
      getValue() ? (
        <Button color="link" onClick={() => row.toggleExpanded()} icon={Search}>
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
  sort: { key: string; desc: boolean };
  onChangeSort(sort: { key: string; desc: boolean }): void;
  limit: number;
  onChangeLimit(limit: number): void;
  currentPage: number;
  onChangePage(page: number): void;
  totalItems: number;
  dataset?: Array<ActivityLog>;
}) {
  return (
    <ExpandableDatatable<ActivityLog>
      title="Activity Logs"
      titleIcon={History}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={{
        pageSize: limit,
        search: keyword,
        setPageSize: onChangeLimit,
        setSearch: onChangeKeyword,
        setSortBy: (key, desc) =>
          onChangeSort({ key: key || 'timestamp', desc }),
        sortBy: {
          id: sort.key,
          desc: sort.desc,
        },
      }}
      page={currentPage}
      onPageChange={onChangePage}
      isServerSidePagination
      totalCount={totalItems}
      disableSelect
      renderSubRow={(row) => <SubRow item={row.original} />}
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
