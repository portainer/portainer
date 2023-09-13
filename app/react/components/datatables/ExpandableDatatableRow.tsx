import { ReactNode } from 'react';
import { Row } from '@tanstack/react-table';

import { TableRow } from './TableRow';
import { DefaultType } from './types';

interface Props<D extends DefaultType> {
  row: Row<D>;
  disableSelect?: boolean;
  renderSubRow(row: Row<D>): ReactNode;
  expandOnClick?: boolean;
}

export function ExpandableDatatableTableRow<D extends DefaultType>({
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
      {row.getIsExpanded() && row.getCanExpand() && (
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
