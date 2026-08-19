import { columnHelper } from './helper';

export const suspend = columnHelper.accessor((row) => row.Suspend, {
  header: 'Suspend',
  id: 'suspend',
  cell: ({ getValue }) => {
    const suspended = getValue();
    return suspended ? 'Yes' : 'No';
  },
});
