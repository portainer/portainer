import { Column } from 'react-table';

import { EdgeUpdateSchedule } from '../../types';

export const scheduledTime: Column<EdgeUpdateSchedule> = {
  Header: 'Scheduled Time & Date',
  accessor: 'time',
  disableFilters: true,
  Filter: () => null,
  canHide: false,
};
