import { formatDate } from '@/portainer/filters/filters';

import { ConfigMapRowData } from '../types';

import { columnHelper } from './helper';

export const created = columnHelper.accessor((row) => getCreatedAtText(row), {
  header: 'Created',
  id: 'created',
  cell: ({ row }) => getCreatedAtText(row.original),
});

function getCreatedAtText(row: ConfigMapRowData) {
  const owner =
    row.metadata?.labels?.['io.portainer.kubernetes.configuration.owner'];
  const date = formatDate(row.metadata?.creationTimestamp);
  return owner ? `${date} by ${owner}` : date;
}
