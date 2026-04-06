import i18n from '@/i18n';

import { columnHelper } from './helper';

export const title = columnHelper.accessor('title', {
  header: i18n.t('notifications.col_title'),
  id: 'title',
});
