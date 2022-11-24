import { Column } from 'react-table';

import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';

import { DefaultFilter } from '@@/datatables/Filter';

import { useRowContext } from './RowContext';

export const group: Column<Environment> = {
  Header: 'Group',
  accessor: (row) => row.GroupId,
  Cell: GroupCell,
  id: 'groupName',
  Filter: DefaultFilter,
  canHide: true,
};

function GroupCell({ value }: { value: EnvironmentGroupId }) {
  const { groups } = useRowContext();
  const group = groups.find((g) => g.Id === value);

  return group?.Name || '';
}
