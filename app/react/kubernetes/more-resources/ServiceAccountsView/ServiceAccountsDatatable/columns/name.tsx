import { SystemBadge } from '@@/Badge/SystemBadge';
import { Link } from '@@/Link';

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
        <Link
          to="kubernetes.moreResources.serviceAccounts.serviceAccount"
          params={{
            namespace: row.original.namespace,
            name: row.original.name,
          }}
          data-cy={`sa-name-link-${row.original.name}`}
        >
          {row.original.name}
        </Link>
        {row.original.isSystem && <SystemBadge className="ml-auto" />}
      </div>
    ),
  }
);
