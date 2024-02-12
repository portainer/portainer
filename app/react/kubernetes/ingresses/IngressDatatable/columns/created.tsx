import { formatDate } from '@/portainer/filters/filters';
import { appOwnerLabel } from '@/react/kubernetes/applications/constants';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => {
    const owner = row.Labels?.['io.portainer.kubernetes.ingress.owner'];
    const date = formatDate(row.CreationDate);
    return owner ? `${date} by ${owner}` : date;
  },
  {
    header: 'Created',
    cell: ({ row, getValue }) => {
      const date = formatDate(getValue());
      const owner =
        row.original.Labels?.['io.portainer.kubernetes.ingress.owner'] ||
        row.original.Labels?.[appOwnerLabel];

      return owner ? `${date} by ${owner}` : date;
    },
    id: 'created',
  }
);
