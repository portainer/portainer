import { ColumnDef, CellContext } from '@tanstack/react-table';

import { Link } from '@@/Link';

export function buildNameColumn<T extends Record<string, unknown>>(
  nameKey: keyof T,
  idKey: string,
  path: string
): ColumnDef<T> {
  const cell = createCell<T>();

  return {
    header: 'Name',
    accessorKey: nameKey,
    id: 'name',
    cell,
    enableSorting: true,
    sortingFn: 'text',
  };

  function createCell<T extends Record<string, unknown>>() {
    return function NameCell({ renderValue, row }: CellContext<T, unknown>) {
      const name = renderValue() || '';

      if (typeof name !== 'string') {
        return null;
      }

      return (
        <Link to={path} params={{ id: row.original[idKey] }} title={name}>
          {name}
        </Link>
      );
    };
  }
}
