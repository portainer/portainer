import { CellContext, Row } from '@tanstack/react-table';

import { StatusBadge } from '@@/StatusBadge';
import { filterHOC } from '@@/datatables/Filter';

import { ResourceRow } from '../types';

import { columnHelper } from './helper';

export const status = columnHelper.accessor((row) => row.status.label, {
  header: 'Status',
  id: 'status',
  cell: Cell,
  meta: {
    filter: filterHOC(
      'Filter by status',
      // don't include empty values in the filter options
      (rows: Row<ResourceRow>[]) =>
        Array.from(
          new Set(rows.map((row) => row.original.status.label).filter(Boolean))
        )
    ),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<ResourceRow>, _: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    (!!row.original.status.label &&
      filterValue.includes(row.original.status.label)),
});

function Cell({ row }: CellContext<ResourceRow, string>) {
  const { status } = row.original;
  if (!status.label) {
    return '-';
  }

  return <StatusBadge color={status.type}>{status.label}</StatusBadge>;
}
