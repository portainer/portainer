import { Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';

export const group: Column<Environment> = {
  Header: 'Group',
  accessor: (row) => row.GroupId || '-',
  id: 'groupName',
  Filter: DefaultFilter,
  canHide: true,
};
