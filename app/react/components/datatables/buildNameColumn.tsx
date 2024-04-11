import { ColumnDef, CellContext } from '@tanstack/react-table';

import { Link } from '@@/Link';

import { DefaultType } from './types';
import { defaultGetRowId } from './defaultGetRowId';

export function buildNameColumn<T extends DefaultType>(
  nameKey: keyof T,
  path: string,
  dataCy: string,
  idParam = 'id',
  idGetter: (row: T) => string = defaultGetRowId<T>
): ColumnDef<T> {
  const cell = createCell();

  return {
    header: 'Name',
    accessorKey: nameKey,
    id: 'name',
    cell,
    enableSorting: true,
    enableHiding: false,
  };

  function createCell() {
    return function NameCell({ renderValue, row }: CellContext<T, unknown>) {
      const name = renderValue() || '';

      if (typeof name !== 'string') {
        return null;
      }

      return (
        <Link
          to={path}
          params={{ [idParam]: idGetter(row.original) }}
          title={name}
          data-cy={`${dataCy}_${name}`}
        >
          {name}
        </Link>
      );
    };
  }
}
