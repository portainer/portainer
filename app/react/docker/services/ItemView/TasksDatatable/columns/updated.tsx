import i18n from '@/i18n';
import { isoDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const updated = columnHelper.accessor('Updated', {
  header: () => i18n.t('docker.services.tasks.columns.last_update'),
  cell: ({ getValue }) => isoDate(getValue()),
});
