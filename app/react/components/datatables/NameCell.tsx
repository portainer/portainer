import { CellProps, Column } from 'react-table';

import { Link } from '@@/Link';

export function buildNameColumn<T extends Record<string, unknown>>(
  nameKey: string,
  idKey: string,
  path: string
) {
  const name: Column<T> = {
    Header: 'Name',
    accessor: (row) => row[nameKey],
    id: 'name',
    Cell: NameCell,
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  };

  return name;

  function NameCell({ value: name, row }: CellProps<T, string>) {
    return (
      <Link to={path} params={{ id: row.original[idKey] }} title={name}>
        {name}
      </Link>
    );
  }
}
