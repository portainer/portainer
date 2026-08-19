import { ReactNode } from 'react';
import { Row } from '@tanstack/react-table';

import { TableRow } from './TableRow';
import { DefaultType } from './types';

interface Props<D extends DefaultType> {
  row: Row<D>;
  renderSubRow(row: Row<D>): ReactNode;
  expandOnClick?: boolean;
}

export function ExpandableDatatableTableRow<D extends DefaultType>({
  row,
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
      {row.getIsExpanded() && row.getCanExpand() && renderSubRow(row)}
    </>
  );
}
