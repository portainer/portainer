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
  row: { original: schedule },
}: CellProps<EdgeUpdateSchedule, EdgeUpdateSchedule['status']>) {
  if (schedule.time > Date.now() / 1000) {
    return 'Scheduled';
  }

  const statusList = Object.entries(status).map(
    ([environmentId, envStatus]) => ({ ...envStatus, environmentId })
  );

  if (statusList.length === 0) {
    return 'No related environments';
  }

  const error = statusList.find((s) => s.status === StatusType.Failed);

  if (error) {
    return `Failed: (ID: ${error.environmentId}) ${error.error}`;
  }

  const pending = statusList.find((s) => s.status === StatusType.Pending);

  if (pending) {
    return 'Pending';
  }

  return 'Success';
}
