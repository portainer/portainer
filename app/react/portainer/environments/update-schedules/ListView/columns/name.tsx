import { CellProps, Column } from 'react-table';

import { Link } from '@@/Link';

import { EdgeUpdateSchedule } from '../../types';

export const name: Column<EdgeUpdateSchedule> = {
  Header: 'Name',
  accessor: 'name',
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function NameCell({ value: name, row }: CellProps<EdgeUpdateSchedule>) {
  return (
    <Link to=".item" params={{ id: row.original.id }}>
      {name}
    </Link>
  );
}
