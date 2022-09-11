import { Column } from 'react-table';

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
}: {
  value: EdgeUpdateSchedule['status'];
}) {
  const statusList = Object.entries(status).map(
    ([environmentId, envStatus]) => ({ ...envStatus, environmentId })
  );

  if (statusList.length === 0) {
    return 'No related environments';
  }

  const error = statusList.find((s) => s.Type === StatusType.Failed);

  if (error) {
    return `Failed: (ID: ${error.environmentId}) ${error.Error}`;
  }

  const pending = statusList.find((s) => s.Type === StatusType.Pending);

  if (pending) {
    return 'Pending';
  }

  return 'Success';
}
