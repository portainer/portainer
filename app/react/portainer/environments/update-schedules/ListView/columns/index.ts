import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { EdgeUpdateListItemResponse } from '../../queries/list';

import { created } from './created';
import { groups } from './groups';
import { scheduleStatus } from './schedule-status';
import { scheduledTime } from './scheduled-time';
import { scheduleType } from './type';

export const columns = [
  buildNameColumn<EdgeUpdateListItemResponse>('name', '.item'),
  scheduledTime,
  groups,
  scheduleType,
  scheduleStatus,
  created,
];
