import { ColumnDef, CellContext } from '@tanstack/react-table';

import { Link } from '@@/Link';

export function buildNameColumn<T extends Record<string, unknown>>(
  nameKey: keyof T,
  idKey: string,
  path: string,
  idParam = 'id'
): ColumnDef<T> {
  const cell = createCell<T>();

  return {
    header: 'Name',
    accessorKey: nameKey,
    id: 'name',
    cell,
    enableSorting: true,
    enableHiding: false,
  };

  function createCell<T extends Record<string, unknown>>() {
    return function NameCell({ renderValue, row }: CellContext<T, unknown>) {
      const name = renderValue() || '';

      if (typeof name !== 'string') {
        return null;
      }

      return (
        <Link
          to={path}
          params={{ [idParam]: row.original[idKey] }}
          title={name}
        >
          {name}
        </Link>
      );
    };
  }
}
