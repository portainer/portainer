import { CSSProperties, ReactNode } from 'react';
import { Row } from 'react-table';

import { TableRow } from './TableRow';

interface Props<D extends Record<string, unknown>> {
  row: Row<D>;
  className?: string;
  role?: string;
  style?: CSSProperties;
  disableSelect?: boolean;
  renderSubRow(row: Row<D>): ReactNode;
}

export function ExpandableDatatableTableRow<D extends Record<string, unknown>>({
  row,
  className,
  role,
  style,
  disableSelect,
  renderSubRow,
}: Props<D>) {
  return (
    <>
      <TableRow<D>
        cells={row.cells}
        className={className}
        role={role}
        style={style}
      />
      {row.isExpanded && (
        <tr>
          {!disableSelect && <td />}
          <td colSpan={disableSelect ? row.cells.length : row.cells.length - 1}>
            {renderSubRow(row)}
          </td>
        </tr>
      )}
    </>
  );
}
