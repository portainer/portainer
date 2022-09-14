import { CellProps, Column } from 'react-table';

import { EdgeUpdateSchedule, StatusType } from '../../types';
import { getAggregatedStatus } from '../../utils';

export const scheduleStatus: Column<EdgeUpdateSchedule> = {
  Header: 'Status',
  accessor: (schedule) => getAggregatedStatus(schedule.status),
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  Cell: StatusCell,
  disableSortBy: true,
};

function StatusCell({
  value,
}: CellProps<EdgeUpdateSchedule, ReturnType<typeof getAggregatedStatus>>) {
  switch (value.status) {
    case StatusType.Failed:
      return `Failed: ${value.error}`;
    case StatusType.Pending:
      return 'Pending';
    case StatusType.Sent:
      return 'Sent';
    case StatusType.Success:
    default:
      return 'Success';
  }
}
