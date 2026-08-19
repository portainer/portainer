import { columnHelper } from './helper';

export const command = columnHelper.accessor((row) => row.Command, {
  header: 'Command',
  id: 'command',
  cell: ({ getValue }) => getValue() ?? '',
});
