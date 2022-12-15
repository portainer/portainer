import { CellProps, Column } from 'react-table';

import { Link } from '@@/Link';

import { EdgeUpdateListItemResponse } from '../../queries/list';

export const name: Column<EdgeUpdateListItemResponse> = {
  Header: 'Name',
  accessor: 'name',
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function NameCell({
  value: name,
  row,
}: CellProps<EdgeUpdateListItemResponse>) {
  return (
    <Link to=".item" params={{ id: row.original.id }}>
      {name}
    </Link>
  );
}
