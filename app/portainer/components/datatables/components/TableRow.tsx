import { Cell, TableRowProps } from 'react-table';

interface Props<D extends Record<string, unknown> = Record<string, unknown>>
  extends TableRowProps {
  cells: Cell<D>[];
}

export function TableRow<
  D extends Record<string, unknown> = Record<string, unknown>
>({ cells, className, role, style }: Props<D>) {
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
