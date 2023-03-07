import { CellProps, Column, Row } from 'react-table';

import { filterHOC } from '@@/datatables/Filter';

import { Service } from '../../types';

export const type: Column<Service> = {
  Header: 'Type',
  id: 'type',
  accessor: (row) => row.Type,
  Cell: ({ row }: CellProps<Service>) => <div>{row.original.Type}</div>,
  canHide: true,

  disableFilters: false,
  Filter: filterHOC('Filter by type'),
  filter: (rows: Row<Service>[], _filterValue, filters) => {
    if (filters.length === 0) {
      return rows;
    }
    return rows.filter((r) => filters.includes(r.original.Type));
  },
};
