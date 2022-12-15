import { CellProps, Column } from 'react-table';

import { EdgeUpdateListItemResponse } from '../../queries/list';
import { StatusType } from '../../types';

export const scheduleStatus: Column<EdgeUpdateListItemResponse> = {
  Header: 'Status',
  accessor: (row) => row.status,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  Cell: StatusCell,
  disableSortBy: true,
};

function StatusCell({
  value: status,
  row: {
    original: { statusMessage },
  },
}: CellProps<
  EdgeUpdateListItemResponse,
  EdgeUpdateListItemResponse['status']
>) {
  switch (status) {
    case StatusType.Failed:
      return statusMessage;
    default:
      return StatusType[status];
  }
}
