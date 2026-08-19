import { Cell, ColumnMeta, flexRender } from '@tanstack/react-table';
import clsx from 'clsx';

import { DefaultType } from './types';

interface Props<D extends DefaultType = DefaultType> {
  cells: Cell<D, unknown>[];
  className?: string;
  onClick?: () => void;
  'aria-selected'?: boolean;
}

export function TableRow<D extends DefaultType = DefaultType>({
  cells,
  className,
  onClick,
  'aria-selected': ariaSelected,
}: Props<D>) {
  return (
    <tr
      className={clsx(className, { 'cursor-pointer': !!onClick })}
      onClick={onClick}
      aria-selected={ariaSelected}
    >
      {cells.map((cell) => {
        const { className, width } = parseMeta(cell.column.columnDef.meta);
        return (
          <td key={cell.id} className={className} style={{ width }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}

function parseMeta<D extends DefaultType = DefaultType>(
  meta: ColumnMeta<D, unknown> | undefined
) {
  const className =
    !!meta && 'className' in meta && typeof meta.className === 'string'
      ? meta.className
      : '';
  const width =
    !!meta && 'width' in meta && typeof meta.width === 'string'
      ? meta.width
      : undefined;
  return { className, width };
}
