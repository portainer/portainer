import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => formatDate(row.creationDate),
  {
    header: 'Created',
    id: 'created',
    cell: ({ getValue }) => getValue(),
  }
);
