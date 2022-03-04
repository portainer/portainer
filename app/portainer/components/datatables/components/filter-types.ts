import { Row } from 'react-table';

export function multiple<
  D extends Record<string, unknown> = Record<string, unknown>
>(rows: Row<D>[], columnIds: string[], filterValue: string[] = []) {
  if (filterValue.length === 0 || columnIds.length === 0) {
    return rows;
  }

  return rows.filter((row) => {
    const value = row.values[columnIds[0]];
    return filterValue.includes(value);
  });
}
