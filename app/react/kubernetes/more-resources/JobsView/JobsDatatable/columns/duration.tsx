import { columnHelper } from './helper';

export const duration = columnHelper.accessor((row) => row.Duration, {
  header: 'Duration',
  id: 'duration',
  cell: ({ getValue }) => getValue() ?? '',
});
