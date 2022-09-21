import { EdgeUpdateSchedule } from '../types';

export const BASE_URL = '/edge_update_schedules';

export function buildUrl(id?: EdgeUpdateSchedule['id'], action?: string) {
  let url = BASE_URL;

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
