import { useMemo, useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { EdgeTypes, Environment } from '@/react/portainer/environments/types';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { useTags } from '@/portainer/tags/queries';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { AutomationTestingProps } from '@/types';

import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { Datatable, TableRow } from '@@/datatables';

import { columns, DecoratedEnvironment } from './associationTableColumnHelper';

export function EdgeEnvironmentsAssociationTable({
  title,
  query,
  onClickRow = () => {},
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
    sort: tableState.sortBy?.id as 'Group' | 'Name',
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    types: EdgeTypes,
    ...query,
  });
  const groupsQuery = useGroups({
    enabled: environmentsQuery.environments.length > 0,
  });
  const tagsQuery = useTags({
    enabled: environmentsQuery.environments.length > 0,
  });

  const memoizedEnvironments: Array<DecoratedEnvironment> = useMemo(
    () =>
      environmentsQuery.environments.map((env) => ({
        ...env,
        Group: groupsQuery.data?.find((g) => g.Id === env.GroupId)?.Name || '',
        Tags: env.TagIds.map(
          (tagId) => tagsQuery.data?.find((t) => t.ID === tagId)?.Name || ''
        ),
      })),
    [environmentsQuery.environments, groupsQuery.data, tagsQuery.data]
  );

  const { totalCount } = environmentsQuery;

  return (
    <Datatable<DecoratedEnvironment>
      title={title}
      columns={columns}
      settingsManager={tableState}
      dataset={memoizedEnvironments}
      isServerSidePagination
      page={page}
      onPageChange={setPage}
      totalCount={totalCount}
      renderRow={(row) => (
        <TableRow<DecoratedEnvironment>
          cells={row.getVisibleCells()}
          onClick={() => onClickRow(row.original)}
        />
      )}
      data-cy={dataCy}
      disableSelect
    />
  );
}
