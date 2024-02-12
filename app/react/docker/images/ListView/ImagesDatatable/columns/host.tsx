import { columnHelper } from './helper';

export const host = columnHelper.accessor('nodeName', {
  header: 'Host',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
