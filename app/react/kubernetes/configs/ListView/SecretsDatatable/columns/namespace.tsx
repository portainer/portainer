import { Row } from '@tanstack/react-table';

import { filterHOC } from '@/react/components/datatables/Filter';

import { Link } from '@@/Link';

import { SecretRowData } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor((row) => row.Namespace, {
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
        data-cy={`secret-namespace-link-${namespace}`}
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
    row: Row<SecretRowData>,
    _columnId: string,
    filterValue: string[]
  ) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.Namespace ?? ''),
});
