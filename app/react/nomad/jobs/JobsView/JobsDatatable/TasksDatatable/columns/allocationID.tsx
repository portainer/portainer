import { Column } from 'react-table';

import { Task } from '@/react/nomad/types';

export const allocationID: Column<Task> = {
  Header: 'Allocation ID',
  accessor: (row) => row.AllocationID || '-',
  id: 'allocationID',
  disableFilters: true,
  canHide: true,
};
