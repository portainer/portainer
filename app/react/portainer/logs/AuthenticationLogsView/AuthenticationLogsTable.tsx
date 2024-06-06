import { History } from 'lucide-react';

import { Datatable } from '@@/datatables';

import { AuthLog } from './types';
import { columns } from './columns';

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
      title="Authentication events"
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
      data-cy="authentication-logs-datatable"
    />
  );
}
