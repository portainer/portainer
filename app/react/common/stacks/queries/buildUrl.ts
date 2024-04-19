import { Stack } from '../types';

export function buildStackUrl(id?: Stack['Id'], action?: string) {
  const baseUrl = '/stacks';
  const url = id ? `${baseUrl}/${id}` : baseUrl;
  return action ? `${url}/${action}` : url;
}
