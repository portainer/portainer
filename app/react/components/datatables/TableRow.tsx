import { Cell, flexRender } from '@tanstack/react-table';
import clsx from 'clsx';

interface Props<D extends Record<string, unknown> = Record<string, unknown>> {
  cells: Cell<D, unknown>[];
  className?: string;
  onClick?: () => void;
}

export function TableRow<
  D extends Record<string, unknown> = Record<string, unknown>
>({ cells, className, onClick }: Props<D>) {
  return (
    <tr
      className={clsx(className, { 'cursor-pointer': !!onClick })}
      onClick={onClick}
    >
      {cells.map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
