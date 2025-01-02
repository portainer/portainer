import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';
import { useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { AutomationTestingProps } from '@/types';

import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { Datatable, TableRow } from '@@/datatables';

const columHelper = createColumnHelper<Environment>();

const columns = [
  columHelper.accessor('Name', {
    header: 'Name',
    id: 'Name',
    cell: ({ getValue }) => truncate(getValue(), { length: 64 }),
  }),
];

export function GroupAssociationTable({
  title,
  query,
  onClickRow,
  'data-cy': dataCy,
}: {
  title: string;
  query: EnvironmentsQueryParams;
  onClickRow?: (env: Environment) => void;
} & AutomationTestingProps) {
  const tableState = useTableStateWithoutStorage('Name');
  const [page, setPage] = useState(0);
  const environmentsQuery = useEnvironmentList({
    pageLimit: tableState.pageSize,
    page: page + 1,
    search: tableState.search,
    sort: tableState.sortBy?.id as 'Name',
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    ...query,
  });

  const { environments } = environmentsQuery;

  return (
    <Datatable<Environment>
      title={title}
      columns={columns}
      settingsManager={tableState}
      dataset={environments}
      isServerSidePagination
      page={page}
      onPageChange={setPage}
      totalCount={environmentsQuery.totalCount}
      renderRow={(row) => (
        <TableRow<Environment>
          cells={row.getVisibleCells()}
          onClick={onClickRow ? () => onClickRow(row.original) : undefined}
        />
      )}
      data-cy={dataCy}
      disableSelect
    />
  );
}
