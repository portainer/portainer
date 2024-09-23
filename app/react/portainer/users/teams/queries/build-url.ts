import { TeamId } from '../types';

export function buildUrl(id?: TeamId, action?: string) {
  let url = '/teams';

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
