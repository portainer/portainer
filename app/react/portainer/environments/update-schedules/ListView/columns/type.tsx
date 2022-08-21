import { Column } from 'react-table';

import { EdgeUpdateSchedule, Type } from '../../types';

export const scheduleType: Column<EdgeUpdateSchedule> = {
  Header: 'Type',
  accessor: (row) => Type[row.type],
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  // sortType: 'string',
};
