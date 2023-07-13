import { columnHelper } from './helper';

export const host = columnHelper.accessor('NodeName', {
  header: 'Host',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
