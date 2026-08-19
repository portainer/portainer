import { SystemBadge } from '@@/Badge/SystemBadge';
import { Link } from '@@/Link';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    let result = row.Name;
    if (row.IsSystem) {
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
          to="kubernetes.moreResources.job"
          params={{
            namespace: row.original.Namespace,
            name: row.original.Name,
          }}
          data-cy={`job-name-link-${row.original.Namespace}-${row.original.Name}`}
        >
          {row.original.Name}
        </Link>
        {row.original.IsSystem && <SystemBadge className="ml-auto" />}
      </div>
    ),
  }
);
