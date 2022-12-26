import { ScheduleType } from '../../types';

import { columnHelper } from './helper';

export const scheduleType = columnHelper.accessor('type', {
  header: 'Type',
  cell: ({ getValue }) => {
    const value = getValue();

    return ScheduleType[value];
  },
});
