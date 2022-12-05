import { CellProps, Column } from 'react-table';
import _ from 'lodash';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { EdgeUpdateListItemResponse } from '../../queries/list';

export const groups: Column<EdgeUpdateListItemResponse> = {
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
}: CellProps<EdgeUpdateListItemResponse, Array<EdgeGroup['Id']>>) {
  const groupsQuery = useEdgeGroups();

  const groups = _.compact(
    groupsIds.map((id) => groupsQuery.data?.find((g) => g.Id === id))
  );

  return groups.map((g) => g.Name).join(', ');
}
