import _ from 'lodash';

import i18n from '@/i18n';

import { columnHelper } from './helper';

export const type = columnHelper.accessor('type', {
  header: i18n.t('notifications.col_type'),
  id: 'type',
  cell: ({ getValue }) => {
    const value = getValue();

    return _.capitalize(value);
  },
});
