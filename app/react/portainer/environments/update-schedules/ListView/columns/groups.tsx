import { CellProps, Column } from 'react-table';

import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { EdgeUpdateSchedule } from '../../types';

export const groups: Column<EdgeUpdateSchedule> = {
  Header: 'Groups',
  accessor: 'groups',
  Cell: GroupsCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function GroupsCell({
  value: groupsIds,
}: CellProps<EdgeUpdateSchedule, Array<EdgeGroup['Id']>>) {
  return groupsIds.join(', ');
}
