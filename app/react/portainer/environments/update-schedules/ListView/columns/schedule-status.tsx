import { CellContext } from '@tanstack/react-table';

import { EdgeUpdateListItemResponse } from '../../queries/list';
import { StatusType } from '../../types';

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
}: CellContext<
  EdgeUpdateListItemResponse,
  EdgeUpdateListItemResponse['status']
>) {
  const status = getValue();

  switch (status) {
    case StatusType.Failed:
      return statusMessage;
    default:
      return StatusType[status];
  }
}
