import { CellProps, Column, Row } from 'react-table';

import { filterHOC } from '@/react/components/datatables/Filter';

import { Link } from '@@/Link';

import { Ingress } from '../../types';

export const namespace: Column<Ingress> = {
  Header: 'Namespace',
  accessor: 'Namespace',
  Cell: ({ row }: CellProps<Ingress>) => (
    <Link
      to="kubernetes.resourcePools.resourcePool"
      params={{
        id: row.original.Namespace,
      }}
      title={row.original.Namespace}
    >
      {row.original.Namespace}
    </Link>
  ),
  id: 'namespace',
  disableFilters: false,
  canHide: true,
  Filter: filterHOC('Filter by namespace'),
  filter: (rows: Row<Ingress>[], filterValue, filters) => {
    if (filters.length === 0) {
      return rows;
    }
    return rows.filter((r) => filters.includes(r.original.Namespace));
  },
};
