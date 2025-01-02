import { Row } from '@tanstack/react-table';

import { filterHOC } from '@@/datatables/Filter';

import { ServiceRowData } from '../types';

import { columnHelper } from './helper';

export const type = columnHelper.accessor('Type', {
  header: 'Type',
  id: 'type',
  meta: {
    filter: filterHOC('Filter by type'),
  },
  enableColumnFilter: true,
  filterFn: (
    row: Row<ServiceRowData>,
    columnId: string,
    filterValue: string[]
  ) => filterValue.length === 0 || filterValue.includes(row.original.Type),
});
