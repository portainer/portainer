import { Row } from '@tanstack/react-table';

import { filterHOC } from '@@/datatables/Filter';
import { Link } from '@@/Link';

import { CronJob } from '../types';

import { columnHelper } from './helper';

export const namespace = columnHelper.accessor((row) => row.Namespace, {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue, row }) => (
    <Link
      to="kubernetes.resourcePools.resourcePool"
      params={{
        id: getValue(),
      }}
      title={getValue()}
      data-cy={`cronJob-namespace-link-${row.original.Name}`}
    >
      {getValue()}
    </Link>
  ),
  meta: {
    filter: filterHOC('Filter by namespace'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<CronJob>, _columnId: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    filterValue.includes(row.original.Namespace ?? ''),
});
