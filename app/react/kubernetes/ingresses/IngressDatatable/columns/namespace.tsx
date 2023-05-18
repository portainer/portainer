import { CellContext, Row } from '@tanstack/react-table';

import { filterHOC } from '@@/datatables/Filter';
import { Link } from '@@/Link';

import { Ingress } from '../../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('Namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: Cell,
  filterFn: (row: Row<Ingress>, columnId: string, filterValue: string[]) => {
    if (filterValue.length === 0) {
      return true;
    }
    return filterValue.includes(row.original.Namespace);
  },

  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
});

function Cell({ getValue }: CellContext<Ingress, string>) {
  const namespace = getValue();
  return (
    <Link
      to="kubernetes.resourcePools.resourcePool"
      params={{
        id: namespace,
      }}
      title={namespace}
    >
      {namespace}
    </Link>
  );
}
