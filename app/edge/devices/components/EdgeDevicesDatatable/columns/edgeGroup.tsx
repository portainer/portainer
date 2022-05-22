import { CellProps, Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';

export const edgeGroup: Column<Environment> = {
  Header: 'Edge Groups',
  accessor: (row) => row.EdgeGroupName,
  Cell: ({ row }: CellProps<Environment>) => row.original.EdgeGroupName,
  id: 'edgeGroupName',
  Filter: DefaultFilter,
  canHide: true,
};
