import { Row } from '@tanstack/react-table';

import { filterHOC } from '@/react/components/datatables/Filter';

import { Link } from '@@/Link';

import { ConfigMapRowData } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('Namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue }) => {
    const namespace = getValue();
    return (
      <Link
        to="kubernetes.resourcePools.resourcePool"
        params={{
          id: namespace,
        }}
        title={namespace}
        data-cy={`configmap-namespace-link-${namespace}`}
      >
        {namespace}
      </Link>
    );
  },
  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
  filterFn: (
    row: Row<ConfigMapRowData>,
    _columnId: string,
    filterValue: string[]
  ) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.Namespace ?? ''),
});
