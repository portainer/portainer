import { Row } from '@tanstack/react-table';

import { DefaultType } from './types';

export function multiple<D extends DefaultType = DefaultType>(
  { getValue }: Row<D>,
  columnId: string,
  filterValue: string[]
): boolean {
  if (filterValue.length === 0) {
    return true;
  }

  const value = getValue(columnId) as string;

  return filterValue.includes(value);
}
