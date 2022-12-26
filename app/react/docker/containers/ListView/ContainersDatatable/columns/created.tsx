import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('Created', {
  header: 'Created',
  id: 'created',
  cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
});
