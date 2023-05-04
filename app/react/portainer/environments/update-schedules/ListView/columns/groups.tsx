import _ from 'lodash';
import { CellContext } from '@tanstack/react-table';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { EdgeUpdateListItemResponse } from '../../queries/list';

import { columnHelper } from './helper';

export const groups = columnHelper.accessor('edgeGroupIds', {
  header: 'Groups',
  cell: GroupsCell,
});

export function GroupsCell({
  getValue,
}: CellContext<EdgeUpdateListItemResponse, Array<EdgeGroup['Id']>>) {
  const groupsIds = getValue();
  const groupsQuery = useEdgeGroups();

  const groups = _.compact(
    groupsIds.map((id) => groupsQuery.data?.find((g) => g.Id === id))
  );

  return groups.map((g) => g.Name).join(', ');
}
