import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const started = columnHelper.accessor(
  (row) => formatDate(row.StartTime),
  {
    header: 'Started',
    id: 'started',
    cell: ({ getValue }) => getValue() ?? '',
  }
);
