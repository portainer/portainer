import i18n from '@/i18n';

import { columnHelper } from './helper';

export const details = columnHelper.accessor('details', {
  header: i18n.t('notifications.col_details'),
  id: 'details',
  cell: ({ getValue }) => {
    const value = getValue();

    return <div className="whitespace-normal">{value}</div>;
  },
});
