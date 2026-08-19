import { columnHelper } from './helper';

export const finished = columnHelper.accessor((row) => row.FinishTime, {
  header: 'Finished',
  id: 'finished',
  cell: ({ getValue }) => getValue() ?? '',
});
