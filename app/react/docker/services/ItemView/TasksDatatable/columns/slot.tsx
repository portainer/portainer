import i18n from '@/i18n';

import { columnHelper } from './helper';

export const slot = columnHelper.accessor((item) => item.Slot || '-', {
  id: 'slot',
  header: () => i18n.t('docker.services.tasks.columns.slot'),
});
