import { createColumnHelper } from '@tanstack/react-table';
import { Check, History, X } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { Datatable } from '@@/datatables';
import { multiple } from '@@/datatables/filter-types';
import { filterHOC } from '@@/datatables/Filter';
import { Icon } from '@@/Icon';

enum AuthMethodType {
  Internal = 1,
  LDAP,
  OAuth,
}

enum ActivityType {
  AuthSuccess = 1,
  AuthFailure,
  Logout,
}

interface AuthLog {
  timestamp: number;
  context: AuthMethodType;
  id: number;
  username: string;
  type: ActivityType;
  origin: string;
}

const activityTypesProps = {
  [ActivityType.AuthSuccess]: {
    label: 'Authentication success',
    icon: Check,
    mode: 'success',
  },
  [ActivityType.AuthFailure]: {
    label: 'Authentication failure',
    icon: X,
    mode: 'danger',
  },
  [ActivityType.Logout]: { label: 'Logout', icon: undefined, mode: undefined },
} as const;

const columnHelper = createColumnHelper<AuthLog>();

const columns = [
  columnHelper.accessor('timestamp', {
    header: 'Time',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? isoDateFromTimestamp(value) : '';
    },
  }),
  columnHelper.accessor('origin', {
    header: 'Origin',
  }),
  columnHelper.accessor(({ context }) => AuthMethodType[context] || '', {
    header: 'Context',
    enableColumnFilter: true,
    filterFn: multiple,
    meta: {
      filter: filterHOC('Filter'),
    },
  }),
  columnHelper.accessor('username', {
    header: 'User',
  }),

  columnHelper.accessor((item) => activityTypesProps[item.type].label, {
    header: 'Result',
    enableColumnFilter: true,
    filterFn: multiple,
    meta: {
      filter: filterHOC('Filter'),
    },
    cell({ row: { original: item } }) {
      const props = activityTypesProps[item.type];
      if (!props) {
        return null;
      }

      const { label, icon, mode } = props;

      return (
        <>
          {label}
          {icon && mode && <Icon icon={icon} mode={mode} />}
        </>
      );
    },
  }),
];

export function AuthenticationLogsTable({
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
  dataset?: Array<AuthLog>;
}) {
  return (
    <Datatable<AuthLog>
      title="Authentication Events"
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
    />
  );
}
