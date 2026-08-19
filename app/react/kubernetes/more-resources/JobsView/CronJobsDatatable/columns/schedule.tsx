import { columnHelper } from './helper';

export const schedule = columnHelper.accessor((row) => row.Schedule, {
  header: 'Schedule',
  id: 'schedule',
  cell: ({ getValue }) => getValue() ?? '',
});
