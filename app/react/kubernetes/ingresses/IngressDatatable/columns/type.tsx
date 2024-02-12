import { columnHelper } from './helper';

export const type = columnHelper.accessor('Type', {
  header: 'Type',
  id: 'type',
  cell: ({ row }) => row.original.Type || '-',
});
