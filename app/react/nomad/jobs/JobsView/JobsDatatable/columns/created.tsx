import { isoDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('SubmitTime', {
  header: 'Created',
  id: 'created',
  cell: ({ getValue }) => {
    const date = getValue();
    return date ? isoDate(parseInt(date, 10)) : '-';
  },
});
