import { Link } from '@@/Link';

import { columnHelper } from './helper';

export const roleKind = columnHelper.accessor('roleRef.kind', {
  header: 'Role Kind',
  id: 'roleKind',
  cell: ({ row }) => {
    const to =
      row.original.roleRef.kind === 'ClusterRole'
        ? 'kubernetes.moreResources.clusterRoles'
        : 'kubernetes.moreResources.roles';
    const tabParam =
      row.original.roleRef.kind === 'ClusterRole' ? 'clusterRoles' : 'roles';
    return (
      <Link
        to={to}
        params={{ tab: tabParam }}
        data-cy={`role-binding-role-kind-link-${row.original.roleRef.kind}`}
      >
        {row.original.roleRef.kind}
      </Link>
    );
  },
});
