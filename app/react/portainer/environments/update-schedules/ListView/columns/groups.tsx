import { CellProps, Column } from 'react-table';
import _ from 'lodash';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { EdgeUpdateSchedule } from '../../types';

export const groups: Column<EdgeUpdateSchedule> = {
  Header: 'Groups',
  accessor: 'edgeGroupIds',
  Cell: GroupsCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  disableSortBy: true,
};

export function GroupsCell({
  value: groupsIds,
}: CellProps<EdgeUpdateSchedule, Array<EdgeGroup['Id']>>) {
  const groupsQuery = useEdgeGroups();

  const groups = _.compact(
    groupsIds.map((id) => groupsQuery.data?.find((g) => g.Id === id))
  );

  return groups.map((g) => g.Name).join(', ');
}
