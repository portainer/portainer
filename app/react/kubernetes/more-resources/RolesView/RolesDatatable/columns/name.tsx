import { SystemBadge } from '@@/Badge/SystemBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';
import { Link } from '@@/Link';

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
        <Link
          to="kubernetes.moreResources.role"
          params={{
            namespace: row.original.namespace,
            name: row.original.name,
          }}
          data-cy={`role-name-link-${row.original.namespace}-${row.original.name}`}
        >
          {row.original.name}
        </Link>
        <div className="ml-auto flex gap-2">
          {row.original.isSystem && <SystemBadge />}
          {row.original.isUnused && <UnusedBadge />}
        </div>
      </div>
    ),
  }
);
