import i18n from '@/i18n';
import { humanize } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const size = columnHelper.accessor('size', {
  id: 'size',
  header: () => i18n.t('docker.images.columns.size'),
  cell: ({ getValue }) => {
    const value = getValue();
    return humanize(value) || '-';
  },
});
