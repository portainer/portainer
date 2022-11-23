import { Column } from 'react-table';

import { Job } from '@/react/nomad/types';
import { isoDate } from '@/portainer/filters/filters';

export const created: Column<Job> = {
  Header: 'Created',
  accessor: (row) =>
    row.SubmitTime ? isoDate(parseInt(row.SubmitTime, 10)) : '-',
  id: 'createdName',
  disableFilters: true,
  canHide: true,
};
