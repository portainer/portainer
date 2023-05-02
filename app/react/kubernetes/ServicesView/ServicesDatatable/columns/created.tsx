import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('CreationTimestamp', {
  header: 'Created',
  id: 'created',
  cell: ({ row, getValue }) => {
    const date = formatDate(getValue());

    const owner =
      row.original.Labels?.['io.portainer.kubernetes.application.owner'];

    if (owner) {
      return `${date} by ${owner}`;
    }

    return date;
  },
});
