import { useMemo, useState } from 'react';

import { useTags } from '@/portainer/tags/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { EdgeTypes, Environment } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';
import {
  columns,
  DecoratedEnvironment,
} from '@/react/edge/components/associationTableColumnHelper';

import { Datatable, TableRow } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';

export function EdgeGroupAssociationTable({
  title,
  query,
  onClickRow = () => {},
  addEnvironments = [],
  excludeEnvironments = [],
  'data-cy': dataCy,
}: {
  title: string;
  query: EnvironmentsQueryParams;
  onClickRow?: (env: Environment) => void;
  addEnvironments?: Environment[];
  excludeEnvironments?: Environment[];
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
    excludeIds: excludeEnvironments?.map((env) => env.Id),
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

  const memoizedAddEnvironments: Array<DecoratedEnvironment> = useMemo(
    () =>
      addEnvironments.map((env) => ({
        ...env,
        Group: groupsQuery.data?.find((g) => g.Id === env.GroupId)?.Name || '',
        Tags: env.TagIds.map(
          (tagId) => tagsQuery.data?.find((t) => t.ID === tagId)?.Name || ''
        ),
      })),
    [addEnvironments, groupsQuery.data, tagsQuery.data]
  );

  // Filter out environments that are already in the table, this is to prevent duplicates, which can happen when an environment is associated and then disassociated
  const filteredAddEnvironments = memoizedAddEnvironments.filter(
    (env) => !memoizedEnvironments.some((e) => e.Id === env.Id)
  );

  return (
    <Datatable<DecoratedEnvironment>
      title={title}
      columns={columns}
      settingsManager={tableState}
      dataset={memoizedEnvironments.concat(filteredAddEnvironments)}
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
