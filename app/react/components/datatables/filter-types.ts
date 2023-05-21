import { Row } from '@tanstack/react-table';

export function multiple<
  D extends Record<string, unknown> = Record<string, unknown>
>({ getValue }: Row<D>, columnId: string, filterValue: string[]): boolean {
  if (filterValue.length === 0) {
    return true;
  }

  const value = getValue(columnId) as string;

  return filterValue.includes(value);
}
