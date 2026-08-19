import { Row } from '@tanstack/react-table';

import { filterHOC } from '@@/datatables/Filter';

import { ResourceRow } from '../types';

import { columnHelper } from './helper';

export const resourceType = columnHelper.accessor((row) => row.resourceType, {
  header: 'Resource type',
  id: 'resourceType',
  meta: {
    filter: filterHOC('Filter by resource type'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<ResourceRow>, _: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    (!!row.original.resourceType &&
      filterValue.includes(row.original.resourceType)),
});
