import { formatDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const date = columnHelper.accessor(
  (event) => formatDate(event.lastTimestamp || event.eventTime),
  {
    header: 'Date',
    id: 'Date',
  }
);
