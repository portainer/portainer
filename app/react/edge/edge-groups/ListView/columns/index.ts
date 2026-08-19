import { columnHelper } from './helper';
import { name } from './name';

export const columns = [
  name,
  columnHelper.accessor((group) => group.TrustedEndpoints.length, {
    header: 'Environments Count',
  }),
  columnHelper.accessor('Dynamic', {
    header: 'Group Type',
    cell: ({ getValue }) => (getValue() ? 'Dynamic' : 'Static'),
  }),
];
