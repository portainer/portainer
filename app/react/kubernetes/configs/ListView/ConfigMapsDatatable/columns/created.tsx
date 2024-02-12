import { formatDate } from '@/portainer/filters/filters';
import { appOwnerLabel } from '@/react/kubernetes/applications/constants';

import { ConfigMapRowData } from '../types';
import { configurationOwnerUsernameLabel } from '../../../constants';

import { columnHelper } from './helper';

export const created = columnHelper.accessor((row) => getCreatedAtText(row), {
  header: 'Created',
  id: 'created',
  cell: ({ row }) => getCreatedAtText(row.original),
});

function getCreatedAtText(row: ConfigMapRowData) {
  const owner =
    row.metadata?.labels?.[configurationOwnerUsernameLabel] ||
    row.metadata?.labels?.[appOwnerLabel];
  const date = formatDate(row.metadata?.creationTimestamp);
  return owner ? `${date} by ${owner}` : date;
}
