import { CellProps, Column } from 'react-table';

import { formatDate } from '@/portainer/filters/filters';

import { Service } from '../../types';

export const created: Column<Service> = {
  Header: 'Created',
  id: 'created',
  accessor: (row) => row.CreationTimestamp,
  Cell: ({ row }: CellProps<Service>) => {
    const owner =
      row.original.Labels?.['io.portainer.kubernetes.application.owner'];

    if (owner) {
      return `${formatDate(row.original.CreationTimestamp)} by ${owner}`;
    }

    return formatDate(row.original.CreationTimestamp);
  },
  disableFilters: true,
  canHide: true,
};
