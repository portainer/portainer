import { columnHelper } from './helper';

export const status = columnHelper.accessor('Status', {
  header: 'Job Status',
  id: 'status',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
