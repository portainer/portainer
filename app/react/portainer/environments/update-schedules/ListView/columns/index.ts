import { created } from './created';
import { groups } from './groups';
import { name } from './name';
import { scheduleStatus } from './schedule-status';
// import { scheduledTime } from './scheduled-time';
import { scheduleType } from './type';

export const columns = [
  name,
  // scheduledTime,
  groups,
  scheduleType,
  scheduleStatus,
  created,
];
