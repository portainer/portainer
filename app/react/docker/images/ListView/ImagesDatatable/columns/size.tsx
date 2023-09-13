import { humanize } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

export const size = columnHelper.accessor('VirtualSize', {
  id: 'size',
  header: 'Size',
  cell: ({ getValue }) => {
    const value = getValue();
    return humanize(value) || '-';
  },
});
