import { Column } from 'react-table';

import { Ingress } from '../../types';

export const type: Column<Ingress> = {
  Header: 'Type',
  accessor: 'Type',
  id: 'type',
  disableFilters: true,
  canHide: true,
};
