import { Fragment, PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';

interface Props<T extends Record<string, unknown> = Record<string, unknown>> {
  isLoading?: boolean;
  rows: Row<T>[];
  emptyContent?: string;
  renderRow(row: Row<T>): React.ReactNode;
}

export function TableContent<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  isLoading = false,
  rows,
  emptyContent = 'No items available',
  renderRow,
}: Props<T>) {
  if (isLoading) {
    return <TableContentOneColumn>Loading...</TableContentOneColumn>;
  }

  if (!rows.length) {
    return <TableContentOneColumn>{emptyContent}</TableContentOneColumn>;
  }

  return (
    <>
      {rows.map((row) => (
        <Fragment key={row.id}>{renderRow(row)}</Fragment>
      ))}
    </>
  );
}

function TableContentOneColumn({ children }: PropsWithChildren<unknown>) {
  // using MAX_SAFE_INTEGER to make sure the single column will be the size of the table
  return (
    <tr>
      <td colSpan={Number.MAX_SAFE_INTEGER} className="text-muted text-center">
        {children}
      </td>
    </tr>
  );
}
