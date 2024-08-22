import { SystemBadge } from '@@/Badge/SystemBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    let result = row.name;
    if (row.isSystem) {
      result += ' system';
    }
    if (row.isUnused) {
      result += ' unused';
    }
    return result;
  },
  {
    header: 'Name',
    id: 'name',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <div>{row.original.name}</div>
        {row.original.isSystem && <SystemBadge />}
        {!row.original.isSystem && row.original.isUnused && <UnusedBadge />}
      </div>
    ),
  }
);
