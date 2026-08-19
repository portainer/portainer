import { columnHelper } from './helper';

export const timezone = columnHelper.accessor((row) => row.Timezone, {
  header: 'Timezone',
  id: 'timezone',
  cell: ({ getValue }) => getValue() ?? '',
});
