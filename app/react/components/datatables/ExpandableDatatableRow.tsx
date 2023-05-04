import { ReactNode } from 'react';
import { Row } from '@tanstack/react-table';

import { TableRow } from './TableRow';

interface Props<D extends Record<string, unknown>> {
  row: Row<D>;
  disableSelect?: boolean;
  renderSubRow(row: Row<D>): ReactNode;
  expandOnClick?: boolean;
}

export function ExpandableDatatableTableRow<D extends Record<string, unknown>>({
  row,
  disableSelect,
  renderSubRow,
  expandOnClick,
}: Props<D>) {
  const cells = row.getVisibleCells();

  return (
    <>
      <TableRow<D>
        cells={cells}
        onClick={expandOnClick ? () => row.toggleExpanded() : undefined}
      />
      {row.getIsExpanded() && (
        <tr>
          {!disableSelect && <td />}
          <td colSpan={disableSelect ? cells.length : cells.length - 1}>
            {renderSubRow(row)}
          </td>
        </tr>
      )}
    </>
  );
}
