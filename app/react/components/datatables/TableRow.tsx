import { Cell, ColumnMeta, flexRender } from '@tanstack/react-table';
import clsx from 'clsx';

import { DefaultType } from './types';

interface Props<D extends DefaultType = DefaultType> {
  cells: Cell<D, unknown>[];
  className?: string;
  onClick?: () => void;
}

export function TableRow<D extends DefaultType = DefaultType>({
  cells,
  className,
  onClick,
}: Props<D>) {
  return (
    <tr
      className={clsx(className, { 'cursor-pointer': !!onClick })}
      onClick={onClick}
    >
      {cells.map((cell) => (
        <td key={cell.id} className={getClassName(cell.column.columnDef.meta)}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

function getClassName<D extends DefaultType = DefaultType>(
  meta: ColumnMeta<D, unknown> | undefined
) {
  return !!meta && 'className' in meta && typeof meta.className === 'string'
    ? meta.className
    : '';
}
