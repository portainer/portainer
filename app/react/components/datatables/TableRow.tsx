import { Cell, TableRowProps } from 'react-table';

import { useTableContext } from './TableContainer';

interface Props<D extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<TableRowProps, 'key'> {
  cells: Cell<D>[];
}

export function TableRow<
  D extends Record<string, unknown> = Record<string, unknown>
>({ cells, className, role, style }: Props<D>) {
  useTableContext();

  return (
    <tr className={className} role={role} style={style}>
      {cells.map((cell) => {
        const cellProps = cell.getCellProps({
          className: cell.className,
        });

        return (
          <td
            className={cellProps.className}
            role={cellProps.role}
            style={cellProps.style}
            key={cellProps.key}
          >
            {cell.render('Cell')}
          </td>
        );
      })}
    </tr>
  );
}
