import i18n from '@/i18n';
import { isoDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const time = columnHelper.accessor('timeStamp', {
  header: i18n.t('notifications.col_time'),
  id: 'time',
  cell: ({ getValue }) => {
    const value = getValue();

    return value ? isoDate(value) : '-';
  },
});
