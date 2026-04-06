import i18n from '@/i18n';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const created = columnHelper.accessor('created', {
  id: 'created',
  header: () => i18n.t('docker.images.columns.created'),
  cell: ({ getValue }) => {
    const value = getValue();
    return isoDateFromTimestamp(value);
  },
});
