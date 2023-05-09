import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => {
    const owner = row.Labels?.['io.portainer.kubernetes.application.owner'];
    const date = formatDate(row.CreationTimestamp);
    return owner ? `${date} by ${owner}` : date;
  },
  {
    header: 'Created',
    id: 'created',
    cell: ({ row }) => {
      const date = formatDate(row.original.CreationTimestamp);

      const owner =
        row.original.Labels?.['io.portainer.kubernetes.application.owner'];

      return owner ? `${date} by ${owner}` : date;
    },
  }
);
