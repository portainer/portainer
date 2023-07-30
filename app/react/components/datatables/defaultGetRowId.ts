import { DefaultType } from './types';

/**
 * gets row id by looking for one of id, Id, or ID keys on the object
 */
export function defaultGetRowId<D extends DefaultType>(row: D): string {
  const key = ['id', 'Id', 'ID'].find((key) =>
    Object.hasOwn(row, key)
  ) as keyof D;

  const value = row[key];

  if (typeof value === 'string' || typeof value === 'number') {
    return value.toString();
  }

  return '';
}
