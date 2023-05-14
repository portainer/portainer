import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';
import { useMemo, useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { useTags } from '@/portainer/tags/queries';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { AutomationTestingProps } from '@/types';

import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { Datatable, TableRow } from '@@/datatables';

type DecoratedEnvironment = Environment & {
  Tags: string[];
  Group: string;
};

const columHelper = createColumnHelper<DecoratedEnvironment>();

const columns = [
  columHelper.accessor('Name', {
    header: 'Name',
    id: 'Name',
    cell: ({ getValue }) => truncate(getValue(), { length: 64 }),
  }),
  columHelper.accessor('Group', {
    header: 'Group',
    id: 'Group',
    cell: ({ getValue }) => truncate(getValue(), { length: 64 }),
  }),
  columHelper.accessor((row) => row.Tags.join(','), {
    header: 'Tags',
    id: 'tags',
    enableSorting: false,
    cell: ({ getValue }) => truncate(getValue(), { length: 64 }),
  }),
];

export function EdgeGroupAssociationTable({
  title,
  query,
  emptyContentLabel,
  onClickRow,
  'data-cy': dataCy,
  hideEnvironmentIds = [],
}: {
  title: string;
  query: EnvironmentsQueryParams;
  emptyContentLabel: string;
  onClickRow: (env: Environment) => void;
  hideEnvironmentIds?: EnvironmentId[];
} & AutomationTestingProps) {
  const tableState = useTableStateWithoutStorage('Name');
  const [page, setPage] = useState(1);
  const environmentsQuery = useEnvironmentList({
    pageLimit: tableState.pageSize,
    page,
    search: tableState.search,
    sort: tableState.sortBy.id as 'Group' | 'Name',
    order: tableState.sortBy.desc ? 'desc' : 'asc',
    ...query,
  });
  const groupsQuery = useGroups({
    enabled: environmentsQuery.environments.length > 0,
  });
  const tagsQuery = useTags({
    enabled: environmentsQuery.environments.length > 0,
  });

  const environments: Array<DecoratedEnvironment> = useMemo(
    () =>
      environmentsQuery.environments
        .filter((e) => !hideEnvironmentIds.includes(e.Id))
        .map((env) => ({
          ...env,
          Group:
            groupsQuery.data?.find((g) => g.Id === env.GroupId)?.Name || '',
          Tags: env.TagIds.map(
            (tagId) => tagsQuery.data?.find((t) => t.ID === tagId)?.Name || ''
          ),
        })),
    [
      environmentsQuery.environments,
      groupsQuery.data,
      hideEnvironmentIds,
      tagsQuery.data,
    ]
  );

  const totalCount = environmentsQuery.totalCount - hideEnvironmentIds.length;

  return (
    <Datatable<DecoratedEnvironment>
      title={title}
      columns={columns}
      settingsManager={tableState}
      dataset={environments}
      onPageChange={setPage}
      pageCount={Math.ceil(totalCount / tableState.pageSize)}
      renderRow={(row) => (
        <TableRow<DecoratedEnvironment>
          cells={row.getVisibleCells()}
          onClick={() => onClickRow(row.original)}
        />
      )}
      emptyContentLabel={emptyContentLabel}
      data-cy={dataCy}
      disableSelect
      totalCount={totalCount}
    />
  );
}
