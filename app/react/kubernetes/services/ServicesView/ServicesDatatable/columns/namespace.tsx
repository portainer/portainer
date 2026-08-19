import { Row } from '@tanstack/react-table';

import { filterHOC } from '@/react/components/datatables/Filter';

import { Link } from '@@/Link';

import { ServiceRowData } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('Namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue, row }) => {
    const namespace = getValue();

    return (
      <Link
        to="kubernetes.resourcePools.resourcePool"
        params={{
          id: namespace,
        }}
        title={namespace}
        data-cy={`service-namespace-link-${row.original.Name}`}
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
    row: Row<ServiceRowData>,
    columnId: string,
    filterValue: string[]
  ) => filterValue.length === 0 || filterValue.includes(row.original.Namespace),
});
