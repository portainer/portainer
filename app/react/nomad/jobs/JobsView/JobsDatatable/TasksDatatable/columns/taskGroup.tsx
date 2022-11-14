import { Column } from 'react-table';

import { Task } from '@/react/nomad/types';

export const taskGroup: Column<Task> = {
  Header: 'Task Group',
  accessor: (row) => row.TaskGroup || '-',
  id: 'taskGroup',
  disableFilters: true,
  canHide: true,
};
