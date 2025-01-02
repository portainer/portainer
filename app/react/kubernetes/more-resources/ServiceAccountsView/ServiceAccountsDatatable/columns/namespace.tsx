import { Row } from '@tanstack/react-table';

import { Link } from '@@/Link';
import { filterHOC } from '@@/datatables/Filter';

import { ServiceAccount } from '../../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ row }) => (
    <Link
      to="kubernetes.resourcePools.resourcePool"
      params={{
        id: row.original.namespace,
      }}
      title={row.original.namespace}
      data-cy={`service-account-namespace-link-${row.original.name}`}
    >
      {row.original.namespace}
    </Link>
  ),
  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
  filterFn: (
    row: Row<ServiceAccount>,
    _columnId: string,
    filterValue: string[]
  ) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.namespace ?? ''),
});
