import { EdgeUpdateSchedule } from '../types';

export const BASE_URL = '/edge_update_schedules';

export function buildUrl(id?: EdgeUpdateSchedule['id']) {
  return !id ? BASE_URL : `${BASE_URL}/${id}`;
}
