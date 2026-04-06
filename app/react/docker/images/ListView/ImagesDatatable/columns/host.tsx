import i18n from '@/i18n';

import { columnHelper } from './helper';

export const host = columnHelper.accessor('nodeName', {
  header: () => i18n.t('docker.images.columns.host'),
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
