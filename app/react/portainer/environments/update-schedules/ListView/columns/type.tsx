import { Column } from 'react-table';

import { EdgeUpdateSchedule, ScheduleType } from '../../types';

export const scheduleType: Column<EdgeUpdateSchedule> = {
  Header: 'Type',
  accessor: (row) => ScheduleType[row.type],
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};
