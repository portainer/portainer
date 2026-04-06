import i18n from '@/i18n';

import { columnHelper } from './helper';

export const stack = columnHelper.accessor((row) => row.StackName || '-', {
  header: i18n.t('common.stack') as string,
  id: 'stack',
});
