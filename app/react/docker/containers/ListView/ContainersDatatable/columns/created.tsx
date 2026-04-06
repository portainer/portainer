import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import i18n from '@/i18n';

import { columnHelper } from './helper';

export const created = columnHelper.accessor(
  (row) => isoDateFromTimestamp(row.Created),
  {
    header: i18n.t('common.created') as string,
    id: 'created',
    cell: ({ row }) => isoDateFromTimestamp(row.original.Created),
  }
);
