import { CellProps, Column, Row } from 'react-table';

import { filterHOC } from '@/react/components/datatables/Filter';

import { Link } from '@@/Link';

import { Service } from '../../types';

export const namespace: Column<Service> = {
  Header: 'Namespace',
  id: 'namespace',
  accessor: 'Namespace',
  Cell: ({ row }: CellProps<Service>) => (
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
  canHide: true,
  disableFilters: false,
  Filter: filterHOC('Filter by namespace'),
  filter: (rows: Row<Service>[], _filterValue, filters) => {
    if (filters.length === 0) {
      return rows;
    }
    return rows.filter((r) => filters.includes(r.original.Namespace));
  },
};
