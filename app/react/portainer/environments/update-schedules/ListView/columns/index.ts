import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { DecoratedItem } from '../types';

import { created } from './created';
import { groups } from './groups';
import { scheduleStatus } from './schedule-status';
import { scheduledTime } from './scheduled-time';
import { scheduleType } from './type';

export const columns = [
  buildNameColumn<DecoratedItem>('name', '.item'),
  scheduledTime,
  groups,
  scheduleType,
  scheduleStatus,
  created,
];
