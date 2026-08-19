import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => {
    const owner = row.Labels?.['io.portainer.kubernetes.application.owner'];
    const date = formatDate(row.CreationDate);
    return owner ? `${date} by ${owner}` : date;
  },
  {
    header: 'Created',
    id: 'created',
    cell: ({ row }) => {
      const date = formatDate(row.original.CreationDate);

      const owner =
        row.original.Labels?.['io.portainer.kubernetes.application.owner'];

      return owner ? `${date} by ${owner}` : date;
    },
  }
);
