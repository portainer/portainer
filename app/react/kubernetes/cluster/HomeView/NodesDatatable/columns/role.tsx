import { getRole } from '../utils';

import { columnHelper } from './helper';

export const role = columnHelper.accessor((row) => getRole(row), {
  header: 'Role',
  cell: ({ row: { original: node } }) => getRole(node),
});
