import { SystemBadge } from '@@/Badge/SystemBadge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    if (row.isSystem) {
      return `${row.name} system`;
    }
    return row.name;
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
