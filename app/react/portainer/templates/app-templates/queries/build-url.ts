import { AppTemplate } from '../types';

export function buildUrl({
  id,
  action,
}: { id?: AppTemplate['id']; action?: string } = {}) {
  let baseUrl = '/templates';

  if (id) {
    baseUrl += `/${id}`;
  }

  if (action) {
    baseUrl += `/${action}`;
  }

  return baseUrl;
}
