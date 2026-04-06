import i18n from '@/i18n';

import { columnHelper } from './helper';
import { name } from './name';

export const columns = [
  name,
  columnHelper.accessor((group) => group.TrustedEndpoints.length, {
    id: 'environmentCount',
    header: () => i18n.t('edge.groups.columns.env_count'),
  }),
  columnHelper.accessor('Dynamic', {
    header: () => i18n.t('edge.groups.columns.group_type'),
    cell: ({ getValue }) => (getValue() ? 'Dynamic' : 'Static'),
  }),
];
