import { PropsWithChildren } from 'react';
import { Row, TableRowProps } from 'react-table';

interface Props<T extends Record<string, unknown> = Record<string, unknown>> {
  isLoading?: boolean;
  rows: Row<T>[];
  emptyContent?: string;
  prepareRow(row: Row<T>): void;
  renderRow(row: Row<T>, rowProps: TableRowProps): React.ReactNode;
}

export function TableContent<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  isLoading = false,
  rows,
  emptyContent = 'No items available',
  prepareRow,
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
      {rows.map((row) => {
        prepareRow(row);
        const { key, className, role, style } = row.getRowProps();
        return renderRow(row, { key, className, role, style });
      })}
    </>
  );
}

function TableContentOneColumn({ children }: PropsWithChildren<unknown>) {
  // using MAX_SAFE_INTEGER to make sure the single column will be the size of the table
  return (
    <tr>
      <td colSpan={Number.MAX_SAFE_INTEGER} className="text-center text-muted">
        {children}
      </td>
    </tr>
  );
}
