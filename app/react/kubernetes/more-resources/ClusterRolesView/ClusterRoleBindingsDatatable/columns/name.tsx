import { SystemBadge } from '@@/Badge/SystemBadge';
import { Link } from '@@/Link';

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
        <Link
          to="kubernetes.moreResources.clusterRoleBinding"
          params={{ name: row.original.name }}
          data-cy={`clusterrolebinding-name-link-${row.original.name}`}
        >
          {row.original.name}
        </Link>
        {row.original.isSystem && <SystemBadge className="ml-auto" />}
      </div>
    ),
  }
);
