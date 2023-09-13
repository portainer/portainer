import { humanize } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const size = columnHelper.accessor('size', {
  id: 'size',
  header: 'Size',
  cell: ({ getValue }) => {
    const value = getValue();
    return humanize(value) || '-';
  },
});
