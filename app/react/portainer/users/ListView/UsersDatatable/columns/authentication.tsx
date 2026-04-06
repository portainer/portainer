import i18n from '@/i18n';

import { helper } from './helper';

export const authentication = helper.accessor('authMethod', {
  header: i18n.t('users.col_auth'),
});
