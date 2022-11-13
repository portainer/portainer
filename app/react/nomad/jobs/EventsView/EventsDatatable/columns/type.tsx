import { Column } from 'react-table';

import { NomadEvent } from '@/react/nomad/types';

export const type: Column<NomadEvent> = {
  Header: 'Type',
  accessor: 'Type',
  id: 'type',
  disableFilters: true,
  canHide: true,
};
