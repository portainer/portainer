import { Column } from 'react-table';

import { ScheduleType } from '../../types';
import { EdgeUpdateListItemResponse } from '../../queries/list';

export const scheduleType: Column<EdgeUpdateListItemResponse> = {
  Header: 'Type',
  accessor: (row) => ScheduleType[row.type],
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};
