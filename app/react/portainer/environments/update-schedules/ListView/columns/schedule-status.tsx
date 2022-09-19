import { CellProps, Column } from 'react-table';

import { EdgeUpdateSchedule, StatusType } from '../../types';

export const scheduleStatus: Column<EdgeUpdateSchedule> = {
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
}: CellProps<EdgeUpdateSchedule, EdgeUpdateSchedule['status']>) {
  switch (status) {
    case StatusType.Failed:
      return statusMessage;
    default:
      return StatusType[status];
  }
}
