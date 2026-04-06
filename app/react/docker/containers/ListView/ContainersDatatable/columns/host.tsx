import i18n from '@/i18n';

import { columnHelper } from './helper';

export const host = columnHelper.accessor((row) => row.NodeName || '-', {
  header: () => i18n.t('docker.containers.columns.host'),
  id: 'host',
});
