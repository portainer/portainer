import { Column } from 'react-table';

import { NomadEvent } from '@/react/nomad/types';
import { isoDate } from '@/portainer/filters/filters';

export const date: Column<NomadEvent> = {
  Header: 'Date',
  accessor: (row) => (row.Date ? isoDate(row.Date) : '-'),
  id: 'date',
  disableFilters: true,
  canHide: true,
};
