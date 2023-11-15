import { EnvironmentId } from '../types';

export function buildUrl(id?: EnvironmentId, action?: string) {
  let baseUrl = 'endpoints';
  if (id) {
    baseUrl += `/${id}`;
  }

  if (action) {
    baseUrl += `/${action}`;
  }

  return baseUrl;
}
