import { CellProps, Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { useGroup } from '@/portainer/environment-groups/queries';

export const group: Column<Environment> = {
  Header: 'Group',
  accessor: (row) => row.GroupId,
  Cell: GroupCell,
  id: 'groupName',
  Filter: DefaultFilter,
  canHide: true,
};

function GroupCell({ value }: CellProps<Environment, EnvironmentGroupId>) {
  const groupName = useGroup(value, (group) => group.Name);

  return groupName;
}
