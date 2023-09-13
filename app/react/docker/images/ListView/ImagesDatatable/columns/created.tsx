import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('Created', {
  id: 'created',
  header: 'Created',
  cell: ({ getValue }) => {
    const value = getValue();
    return isoDateFromTimestamp(value);
  },
});
