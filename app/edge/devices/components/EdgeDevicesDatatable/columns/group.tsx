import { CellProps, Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';

export const group: Column<Environment> = {
  Header: 'Group',
  accessor: (row) => row.GroupId,
  Cell: GroupCell,
  id: 'groupName',
  Filter: DefaultFilter,
  canHide: true,
};

// TODO use useGroupName instead of this
function GroupCell({ value }: CellProps<Environment, EnvironmentGroupId>) {
  return value;
}
