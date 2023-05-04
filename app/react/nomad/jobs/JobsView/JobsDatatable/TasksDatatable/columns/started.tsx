import moment from 'moment';

import { Task } from '@/react/nomad/types';
import { isoDate } from '@/portainer/filters/filters';

import { columnHelper } from './helper';

function accessor(row: Task) {
  const momentDate = moment(row.StartedAt);
  const isValid = momentDate.unix() > 0;
  return isValid ? isoDate(momentDate) : '-';
}

export const started = columnHelper.accessor(accessor, {
  header: 'Started',
  id: 'startedName',
});
