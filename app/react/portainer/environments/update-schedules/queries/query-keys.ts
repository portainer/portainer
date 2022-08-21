import { EdgeUpdateSchedule } from '../types';

export const queryKeys = {
  list: () => ['edge', 'update_schedules'] as const,
  item: (id: EdgeUpdateSchedule['id']) => [...queryKeys.list(), id] as const,
};
