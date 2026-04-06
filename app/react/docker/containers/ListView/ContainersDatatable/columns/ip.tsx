import i18n from '@/i18n';

import { columnHelper } from './helper';

export const ip = columnHelper.accessor((row) => row.IP || '-', {
  header: i18n.t('common.ip_address') as string,
  id: 'ip',
});
