import { SystemBadge } from '@@/Badge/SystemBadge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    let result = row.name;
    if (row.isSystem) {
      result += ' system';
    }
    return result;
  },
  {
    header: 'Name',
    id: 'name',
    cell: ({ row }) => (
      <div className="flex gap-2">
        {row.original.name}
        {row.original.isSystem && <SystemBadge />}
      </div>
    ),
  }
);
