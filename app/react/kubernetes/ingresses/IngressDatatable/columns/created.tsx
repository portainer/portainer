import { CellProps, Column } from 'react-table';

import { formatDate } from '@/portainer/filters/filters';

import { Ingress } from '../../types';

export const created: Column<Ingress> = {
  Header: 'Created',
  id: 'created',
  accessor: (row) => row.CreationDate,
  Cell: ({ row }: CellProps<Ingress>) => {
    const owner =
      row.original.Labels?.['io.portainer.kubernetes.ingress.owner'];

    if (owner) {
      return `${formatDate(row.original.CreationDate)} by ${owner}`;
    }

    return formatDate(row.original.CreationDate);
  },
  disableFilters: true,
  canHide: true,
};
