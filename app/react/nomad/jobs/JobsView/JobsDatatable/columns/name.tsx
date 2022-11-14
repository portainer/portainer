import { CellProps, Column } from 'react-table';

import { Job } from '@/react/nomad/types';

import { ExpandingCell } from '@@/datatables/ExpandingCell';

export const name: Column<Job> = {
  Header: 'Name',
  accessor: (row) => row.ID,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function NameCell({ value: name, row }: CellProps<Job>) {
  return (
    <ExpandingCell row={row} showExpandArrow>
      {name}
    </ExpandingCell>
  );
}
