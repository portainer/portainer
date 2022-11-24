import { Column } from 'react-table';

import { Job } from '@/react/nomad/types';

export const namespace: Column<Job> = {
  Header: 'Namespace',
  accessor: (row) => row.Namespace || '-',
  id: 'namespace',
  disableFilters: true,
  canHide: true,
};
