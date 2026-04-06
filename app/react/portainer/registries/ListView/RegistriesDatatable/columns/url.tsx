import i18n from '@/i18n';

import { DefaultRegistryDomain } from './DefaultRegistryDomain';
import { columnHelper } from './helper';

export const url = columnHelper.accessor('URL', {
  header: i18n.t('registries.col_url'),
  cell: ({ getValue, row: { original: item } }) =>
    item.Id ? getValue() : <DefaultRegistryDomain />,
});
