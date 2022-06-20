import { Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';

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

function GroupCell() {
  const { groupName } = useRowContext();

  return groupName;
}
