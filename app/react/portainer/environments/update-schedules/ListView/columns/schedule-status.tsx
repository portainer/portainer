import { CellContext } from '@tanstack/react-table';

import { StatusType } from '../../types';
import { DecoratedItem } from '../types';

import { columnHelper } from './helper';

export const scheduleStatus = columnHelper.accessor('status', {
  header: 'Status',
  cell: StatusCell,
});

function StatusCell({
  getValue,
  row: {
    original: { statusMessage },
  },
}: CellContext<DecoratedItem, DecoratedItem['status']>) {
  const status = getValue();

  switch (status) {
    case StatusType.Failed:
      return statusMessage;
    default:
      return StatusType[status];
  }
}
