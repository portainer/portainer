import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('CreationDate', {
  header: 'Created',
  cell: ({ row, getValue }) => {
    const date = formatDate(getValue());
    const owner =
      row.original.Labels?.['io.portainer.kubernetes.ingress.owner'];

    if (owner) {
      return `${date} by ${owner}`;
    }

    return date;
  },
  id: 'created',
});
