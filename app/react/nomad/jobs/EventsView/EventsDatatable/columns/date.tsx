import { isoDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const date = columnHelper.accessor('Date', {
  header: 'Date',
  id: 'date',
  cell: ({ getValue }) => {
    const date = getValue();
    return date ? isoDate(date) : '-';
  },
});
