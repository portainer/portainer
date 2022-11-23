import moment from 'moment';
import { Column } from 'react-table';

import { Task } from '@/react/nomad/types';
import { isoDate } from '@/portainer/filters/filters';

function accessor(row: Task) {
  const momentDate = moment(row.StartedAt);
  const isValid = momentDate.unix() > 0;
  return isValid ? isoDate(momentDate) : '-';
}

export const started: Column<Task> = {
  accessor,
  Header: 'Started',
  id: 'startedName',
  disableFilters: true,
  canHide: true,
};
