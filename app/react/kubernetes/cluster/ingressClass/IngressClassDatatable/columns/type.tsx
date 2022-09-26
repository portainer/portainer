import { CellProps, Column } from 'react-table';

import type { IngressControllerClassMap } from '../../types';

export const type: Column<IngressControllerClassMap> = {
  Header: 'Ingress controller type',
  accessor: 'Type',
  Cell: ({ row }: CellProps<IngressControllerClassMap>) =>
    row.original.Type || '-',
  id: 'type',
  disableFilters: true,
  canHide: true,
  Filter: () => null,
};
