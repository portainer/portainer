import { DefaultType } from './types';

export function defaultGetRowId<D extends DefaultType>(row: D): string {
  if (
    'id' in row &&
    (typeof row.id === 'string' || typeof row.id === 'number')
  ) {
    return row.id.toString();
  }

  if (
    'Id' in row &&
    (typeof row.Id === 'string' || typeof row.Id === 'number')
  ) {
    return row.Id.toString();
  }

  if (
    'ID' in row &&
    (typeof row.ID === 'string' || typeof row.ID === 'number')
  ) {
    return row.ID.toString();
  }

  return '';
}
